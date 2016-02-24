import os
from girder.utility.model_importer import ModelImporter
from girder.utility.webroot import Webroot

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
