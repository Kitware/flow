import celery
import cherrypy
import json
import os
import sys
import time

from celery.result import AsyncResult
from six import StringIO

from girder import events
from girder.api import access, rest
from girder.api.describe import Description
from girder.api.rest import Resource
from girder.constants import AccessType
from girder.models.model_base import AccessException, ValidationException
from girder.plugins.worker import getCeleryApp, PluginSettings
from girder.utility.model_importer import ModelImporter
from girder.utility.webroot import Webroot


class FlowPluginSettings(PluginSettings):
    FULL_ACCESS_USERS = 'flow.full_access_users'
    FULL_ACCESS_GROUPS = 'flow.full_access_groups'
    REQUIRE_AUTH = 'flow.require_auth'
    SAFE_FOLDERS = 'flow.safe_folders'


def validateSettings(event):
    """
    Handle plugin-specific system settings. Right now we don't do any
    validation for the broker or backend URL settings, but we do reinitialize
    the celery app object with the new values.
    """
    key = event.info['key']
    val = event.info['value']

    if key == FlowPluginSettings.FULL_ACCESS_USERS:
        if not isinstance(val, (list, tuple)):
            raise ValidationException('Full access users must be a JSON list.')
        event.preventDefault()
    elif key == FlowPluginSettings.FULL_ACCESS_GROUPS:
        if not isinstance(val, (list, tuple)):
            raise ValidationException('Full access groups must be a JSON list.')
        event.preventDefault()
    elif key == FlowPluginSettings.REQUIRE_AUTH:
        if not isinstance(val, bool):
            raise ValidationException(
                'Require auth setting must be true or false.')
        event.preventDefault()
    elif key == FlowPluginSettings.SAFE_FOLDERS:
        if not isinstance(val, (list, tuple)):
            raise ValidationException('Safe folders must be a JSON list.')
        event.preventDefault()


def runAnalysis(user, analysis, kwargs, item):
    # Create the job record.
    jobModel = ModelImporter.model('job', 'jobs')
    public = False
    if user is None:
        public = True
    job = jobModel.createJob(
        title=analysis['name'], type='flow_task',
        handler='worker_handler', user=user, public=public)

    # Create a token that is scoped for updating the job.
    jobToken = jobModel.createJobToken(job)
    apiUrl = cherrypy.url().rsplit('/', 3)[0]

    # These parameters are used to get stdout/stderr back from Celery
    # to Girder.
    kwargs['jobInfo'] = {
        'url': '{}/job/{}'.format(apiUrl, job['_id']),
        'method': 'PUT',
        'headers': {'Girder-Token': jobToken['_id']},
        'logPrint': True
    }

    job['kwargs'] = kwargs
    job['args'] = [analysis]
    job['meta']['flowItemId'] = item['_id']
    job = jobModel.save(job)

    # Schedule the job (triggers the schedule method above)
    jobModel.scheduleJob(job)
    return jobModel.filter(job, user)


@access.public
def flowConvertData(inputType, inputFormat, outputFormat, params):
    content = cherrypy.request.body.read()

    asyncResult = getCeleryApp().send_task('girder_worker.convert', [
        inputType,
        {"data": content, "format": inputFormat},
        {"format": outputFormat}
    ])

    return asyncResult.get()
flowConvertData.description = (
    Description('Convert data from one format to another')
    .param('inputType', 'The type of the input data')
    .param('inputFormat', 'The format of the input data')
    .param('outputFormat', 'The desired output format'))


class Validator(Resource):
    def __init__(self, celeryApp):
        super(Validator, self).__init__()
        self.resourceName = 'flow_validator'
        self.route('GET', (), self.find)
        self.celeryApp = celeryApp

    @access.public
    def find(self, params):
        return self.celeryApp.send_task('girder_worker.validators', [
            params.get('type', None),
            params.get('format', None)]).get()
    find.description = (
        Description('List or search for validators.')
        .param('type', 'Find validators with this type.', required=False)
        .param('format', 'Find validators with this format.', required=False)
    )

def getItemContent(itemId, itemApi):
    item = itemApi.getItem(id=itemId, params={})

    files = [file for file in itemApi.model('item').childFiles(item=item)]

    if len(files) > 1:
        raise Exception('Expected one file for running an analysis')

    stream = itemApi.model('file').download(files[0], headers=False)()
    io = StringIO()
    for chunk in stream:
        io.write(chunk)
    return io.getvalue()


def load(info):
    flow_mako = os.path.join(os.path.dirname(__file__), "flow.mako")
    flow_webroot = Webroot(flow_mako)
    flow_webroot.updateHtmlVars({
        'brand': 'Arbor'
    })

    # @todo somehow the API lives at /api/v1 and /girder/api/v1
    info['serverRoot'], info['serverRoot'].girder = (flow_webroot,
                                                     info['serverRoot'])

    info['serverRoot'].api = info['serverRoot'].girder.api

    staticDir = os.path.join(info['pluginRootDir'], 'static')
    if os.path.isdir(staticDir):
        for path in os.listdir(staticDir):
            if os.path.isdir(os.path.join(staticDir, path)):
                info['config'][str('/' + path)] = {
                    'tools.staticdir.on': True,
                    'tools.staticdir.dir': os.path.join(staticDir, path),
                    'tools.staticdir.index': 'index.html'
                }

    @access.public
    def flowConvert(itemId, inputType, inputFormat, outputFormat, params):
        itemApi = info['apiRoot'].item

        content = getItemContent(itemId, itemApi)

        asyncResult = getCeleryApp().send_task('girder_worker.convert', [
            inputType,
            {"data": content, "format": inputFormat},
            {"format": outputFormat}
        ])

        return asyncResult.get()
    flowConvert.description = (
        Description('Convert an item from one format to another')
        .param('itemId', 'ID of the item to be converted')
        .param('inputType', 'The type of the input data')
        .param('inputFormat', 'The format of the input data')
        .param('outputFormat', 'The desired output format'))

    @access.public
    def getTaskId(jobId):
        # Get the celery task ID for this job.
        jobApi = info['apiRoot'].job
        job = jobApi.model('job', 'jobs').load(
            jobId, user=jobApi.getCurrentUser(), level=AccessType.READ)
        return job["celeryTaskId"]

    @access.public
    def flowRunStatus(itemId, jobId, params):
        celeryTaskId = getTaskId(jobId)

        # Get the celery result for the corresponding task ID.
        result = AsyncResult(celeryTaskId, backend=getCeleryApp().backend)
        try:
            response = {'status': result.state}
            if result.state == celery.states.FAILURE:
                response['message'] = str(result.result)
            elif result.state == 'PROGRESS':
                response['meta'] = str(result.result)
            return response
        except Exception:
            return {
                'status': 'FAILURE',
                'message': sys.exc_info(),
                'trace': sys.exc_info()[2]
            }
    flowRunStatus.description = (
        Description('Show the status of a flow task')
        .param('jobId', 'The job ID for this task.', paramType='path')
        .param('itemId', 'Not used.', paramType='path'))

    @access.public
    def flowRunResult(itemId, jobId, params):
        celeryTaskId = getTaskId(jobId)
        job = AsyncResult(celeryTaskId, backend=getCeleryApp().backend)
        return {'result': job.result}
    flowRunResult.description = (
        Description('Show the final output of a flow task.')
        .param('jobId', 'The job ID for this task.', paramType='path')
        .param('itemId', 'Not used.', paramType='path'))

    @access.public
    @rest.boundHandler(info['apiRoot'].item)
    @rest.loadmodel(map={'itemId': 'item'}, model='item',
                    level=AccessType.READ)
    def flowRun(self, item, params):
        # Make sure that we have permission to perform this analysis.
        # import pudb
        # pu.db
        user = self.getCurrentUser()

        settings = ModelImporter.model('setting')
        requireAuth = settings.get(FlowPluginSettings.REQUIRE_AUTH, True)

        if requireAuth:
            safeFolders = settings.get(FlowPluginSettings.SAFE_FOLDERS, ())
            fullAccessUsers = settings.get(FlowPluginSettings.FULL_ACCESS_USERS, ())
            fullAccessGrps = settings.get(FlowPluginSettings.FULL_ACCESS_GROUPS, ())
            userGrps = {str(id) for id in user.get('groups', ())}

            if (str(item['folderId']) not in safeFolders and (
                    not user or user['login'] not in fullAccessUsers) and
                    not userGrps & set(fullAccessGrps)):
                raise AccessException('Unauthorized user.')

        analysis = item.get('meta', {}).get('analysis')

        if type(analysis) is not dict:
            raise rest.RestException(
                'Must specify a valid JSON object as the "analysis" metadata '
                'field on the input item.')
        # Get the analysis parameters (includes inputs & outputs).
        try:
            kwargs = json.load(cherrypy.request.body)
        except ValueError:
            raise rest.RestException(
                'You must pass a valid JSON object in the request body.')

        return runAnalysis(user, analysis, kwargs, item)
    flowRun.description = (
        Description('Run a task specified by item metadata.')
        .param('itemId', 'The item containing the analysis as metadata.',
               paramType='path')
        .param('kwargs', 'Additional kwargs for the worker task.',
               paramType='body'))

    @access.public
    def flowRunOutput(itemId, jobId, params):
        jobApi = info['apiRoot'].job
        celeryTaskId = getTaskId(jobId)
        timeout = 300
        cherrypy.response.headers['Content-Type'] = 'text/event-stream'
        cherrypy.response.headers['Cache-Control'] = 'no-cache'

        def sseMessage(output):
            if type(output) == unicode:
                output = output.encode('utf8')
            return 'event: log\ndata: {}\n\n'.format(output)

        def streamGen():
            start = time.time()
            endtime = None
            oldLog = ''
            while (time.time() - start < timeout and
                   cherrypy.engine.state == cherrypy.engine.states.STARTED and
                   (endtime is None or time.time() < endtime)):
                # Display new log info from this job since the
                # last execution of this loop.
                job = jobApi.model('job', 'jobs').load(
                    jobId,
                    user=jobApi.getCurrentUser(),
                    level=AccessType.READ)
                newLog = job['log']
                if newLog != oldLog:
                    start = time.time()
                    logDiff = newLog[newLog.find(oldLog) + len(oldLog):]
                    oldLog = newLog
                    # We send a separate message for each line,
                    # as I discovered that any information after the
                    # first newline was being lost...
                    for line in logDiff.rstrip().split('\n'):
                        yield sseMessage(line)
                if endtime is None:
                    result = AsyncResult(celeryTaskId,
                                         backend=getCeleryApp().backend)
                    if (result.state == celery.states.FAILURE or
                            result.state == celery.states.SUCCESS or
                            result.state == celery.states.REVOKED):
                        # Stop checking for messages in 5 seconds
                        endtime = time.time() + 5
                time.sleep(0.5)

            # Signal the end of the stream
            yield 'event: eof\ndata: null\n\n'

            # One more for good measure - client should not get this
            yield 'event: past-end\ndata: null\n\n'

        return streamGen

    @access.public
    def flowStopRun(jobId, params):
        task = AsyncResult(jobId, backend=getCeleryApp().backend)
        task.revoke(getCeleryApp().broker_connection(), terminate=True)
        return {'status': task.state}
    flowStopRun.description = (
        Description('Stop execution of the specified job')
        .param('jobId', 'The Job ID for this task'))

    info['apiRoot'].flow_validator = Validator(getCeleryApp())
    info['apiRoot'].item.route(
        'POST',
        ('flow', ':inputType', ':inputFormat', ':outputFormat'),
        flowConvertData)

    info['apiRoot'].item.route(
        'GET',
        (':itemId', 'flow', ':jobId', 'status'),
        flowRunStatus)

    info['apiRoot'].item.route(
        'GET',
        (':itemId', 'flow', ':jobId', 'result'),
        flowRunResult)

    info['apiRoot'].item.route(
        'POST',
        (':itemId', 'flow'),
        flowRun)

    info['apiRoot'].item.route(
        'GET',
        (':itemId', 'flow', ':jobId', 'output'),
        flowRunOutput)

    info['apiRoot'].item.route(
        'GET',
        (':itemId', 'flow', ':inputType', ':inputFormat',
         ':outputFormat'),
        flowConvert)

    info['apiRoot'].item.route(
        'DELETE',
        (':itemId', 'flow', ':jobId'),
        flowStopRun)

    events.bind('model.setting.validate', 'flow', validateSettings)
