from GirderClient import *
import pymongo

c = GirderClient('localhost', 9000)

# Create an admin user if there isn't one
try:
    c.authenticate('girder', 'girder')
except:
    c.sendRestRequest('POST', 'user', {
        "login": "girder",
        "password": "girder",
        "email": "girder@localhost.com",
        "firstName": "Girder",
        "lastName": "Admin"
        })
    c.authenticate('girder', 'girder')

# Create a tangelo hub collection if there isn't one
coll_search = c.sendRestRequest('GET', 'resource/search', {
    'q': 'Default',
    'types': '["collection"]'
})
if len(coll_search["collection"]) == 0:
    collection = c.createCollection(
        'Default', 'Default workspace', public='true')
    c.createFolder(
        collection, 'collection', 'Data', 'Data folder', public='true')
    c.createFolder(
        collection, 'collection', 'Analyses', 'Analysis folder', public='true')

# Turn on the romanesco plugin
c.sendRestRequest('PUT', 'system/plugins', {"plugins": '["romanesco"]'})

# Create an assetstore if there isn't one
if len(c.sendRestRequest('GET', 'assetstore')) == 0:
    c.sendRestRequest('POST', 'assetstore', {
        'type': '1',
        'name': 'GridFS',
        'db': 'girder-gridfs'
    })
