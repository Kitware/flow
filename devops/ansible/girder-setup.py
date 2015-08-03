from girder_client import GirderClient

c = GirderClient(host='localhost', port=9000)

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
coll_search = c.get('resource/search', parameters={
    'q': 'Default',
    'types': '["collection"]'
})
if len(coll_search["collection"]) == 0:
    collection = c.post('collection', parameters={
        'name': 'Default',
        'description': 'Default workspace',
        'public': 'true'
    })
    c.post('folder', parameters={
        'parentType': 'collection',
        'parentId': collection['_id'],
        'name': 'Data',
        'description': 'Data Folder',
        'public': 'true'
    })
    c.post('folder', parameters={
        'parentType': 'collection',
        'parentId': collection['_id'],
        'name': 'Analyses',
        'description': 'Analysis folder',
        'public': 'true'
    })

# Turn on the romanesco plugin
c.put('system/plugins', parameters={"plugins": '["romanesco"]'})

# Create an assetstore if there isn't one
if len(c.get('assetstore')) == 0:
    c.post('assetstore', parameters={
        'type': '1',
        'name': 'GridFS',
        'db': 'girder-gridfs'
    })
