import os
from girder.utility.webroot import Webroot


def load(info):
    flow_mako = os.path.join(os.path.dirname(__file__), "flow.mako")
    flow_webroot = Webroot(flow_mako)

    info['serverRoot'], info['serverRoot'].girder = (flow_webroot,
                                                     info['serverRoot'])
