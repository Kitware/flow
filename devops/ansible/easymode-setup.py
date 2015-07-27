from girder_client import GirderClient
import json
import pymongo
import sys

if len(sys.argv) < 2:
    print "%s /path/to/ArborWebApps" % sys.argv[0]
    sys.exit(1)
arborWebAppsPath = sys.argv[1]

# Read our analyses into Python dictionaries.
ACR = {}
with open ("%s/ancestral-state/aceArbor.json" % arborWebAppsPath, "r") as acrFile:
    acrStr = acrFile.read()
ACR['analysis'] = json.loads(acrStr)

PGS = {}
with open ("%s/phylogenetic-signal/Phylogenetic_signal.json" % arborWebAppsPath, "r") as pgsFile:
    pgsStr = pgsFile.read()
PGS['analysis'] = json.loads(pgsStr)

# Get the ID for our Analyses folder.
c = GirderClient(host='localhost', port=9000)
c.authenticate('girder', 'girder')
folderSearch = c.get('resource/search', parameters={
    'q': 'Analyses',
    'types': '["folder"]'
})
folderId = folderSearch['folder'][0]['_id']

# Upload our analyses to girder.
item = c.createItem(folderId, 'aceArbor', 'Ancestral state reconstruction')
c.addMetadataToItem(item['_id'], ACR)
item = c.createItem(folderId, 'Phylogenetic signal', 'Phylogenetic signal')
c.addMetadataToItem(item['_id'], PGS)

# Disable authorization requirements for running romanesco tasks
c.put('system/setting', parameters={
    'key': 'romanesco.require_auth',
    'value': 'false'
})
