import os
from girder.plugins.worker import getCeleryApp
from girder.utility.model_importer import ModelImporter
from girder.utility.webroot import Webroot

from girder.api import access
from girder.api.rest import Resource
from girder.api.describe import Description


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


def load(info):
    flow_mako = os.path.join(os.path.dirname(__file__), "flow.mako")
    flow_webroot = Webroot(flow_mako)
    flow_webroot.updateHtmlVars({
        'brand': 'TangeloHub'
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

    info['apiRoot'].flow_validator = Validator(getCeleryApp())
