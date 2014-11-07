TangeloHub [![Build Status](https://travis-ci.org/tangelo-hub/tangelo-hub.png?branch=master)](https://travis-ci.org/tangelo-hub/tangelo-hub)
===========

## Local development setup

The TangeloHub application requires [Tangelo](http://tangelo.readthedocs.org/en/latest/installation.html) and [Girder](http://girder.readthedocs.org/en/latest/installation.html). Follow the links for install instructions. After following the Girder install, you should also have a MongoDB instance running on your machine.

We also need the Romanesco Girder plugin. To install it, navigate to your Girder source and checkout Romanesco in the plugins directory:

    cd girder/plugin
    git clone https://github.com/arborworkflows/romanesco.git

Romanesco requires that you first install [R](http://www.r-project.org/). After you have R installed, start a Romanesco worker with:

    cd romanesco
    sudo pip install -r requirements.txt
    python -m romanesco

Now visit your Girder web interface to enable the Romanesco plugin from the admin console. A restart of Girder is required to fully enable the Romanesco plugin.

TangeloHub requires npm and Grunt, which should already have been installed as part of the Girder installation:

    curl http://npmjs.org/install.sh | sh
    sudo npm install -g grunt

Now checkout the TangeloHub repository. As a team developer:

    git clone git@github.com:tangelo-hub/tangelo-hub.git

Or as a contributor:

    git clone https://github.com/tangelo-hub/tangelo-hub.git

Enter the source folder and build out all the npm dependencies:

    cd tangelo-hub
    npm install

Now we're ready to build the TangeloHub app:

    grunt init
    grunt

Activate Tangelo's Python virtual environment:

    source /path/to/tangelo_bin/venv/bin/activate

Ensure the Girder source directory is in your Python path:

    export PYTHONPATH=$PYTHONPATH:/path/to/girder

Now start up the TangeloHub server:

    tangelo -nd -nc --root ./app --girder-path=/girder start --port 8888

Visit the running TangeloHub instance at [http://localhost:8888](http://localhost:8888).

## Incremental builds

After the initial setup, the following will rebuild the application JavaScript and HTML files:

    grunt init; grunt

## Vagrant setup

A Vagrant install is an easy way to get everything running in a local virtual machine. This includes an install of MongoDB, Girder, Romanesco, Apache, and the TangeloHub application. To get started, install [Vagrant](http://www.vagrantup.com/), [VirtualBox](https://www.virtualbox.org/), and [Ansible](http://docs.ansible.com/intro_installation.html). It's then a matter of cloning this repository and running `vagrant up`.

```
git clone https://github.com/tangelo-hub/tangelo-hub.git
cd tangelo-hub
vagrant up
```

When that completes (it will take some time - get a coffee), visit [http://localhost:9080/](http://localhost:9080/) to visit the interface.

To see the Girder interface, visit [http://localhost:9080/girder](http://localhost:9080/girder).

To create new analyses and save data, login to TangeloHub or Girder with username `girder` and password `girder`.

To log in to your virtual machine, run

```
vagrant ssh
```

From that environment, you can restart Romanesco:

```
sudo stop romanesco
sudo start romanesco
```

To view the Romanesco log for analysis debugging:

```
sudo cat /var/log/upstart/romanesco.log
```

To restart Girder:

```
sudo stop girder
sudo start girder
```

To enter a local MongoDB shell:

```
mongo
```

Note that the default Vagrant install will also install several R libraries needed for Arbor analyses, which takes a significant amount of time. To turn off this step, edit `devops/ansible/playbook.yml` and set the `arbor` variable to `false`.

## Testing

Testing is performed with PhantomJS and uses Python to drive the process and setup a sandboxed Girder environment. Tests are performed automatically by [Travis](https://travis-ci.org/tangelo-hub/tangelo-hub) with resulting test data pushed to a [CDash dashboard](http://my.cdash.org/index.php?project=Tangelo+Hub). To initialize the testing environment, create a build folder and run CMake:

    mkdir build
    cd build
    cmake ..

Run the tests with CTest. Use `-V` for verbose output.

    ctest -V

## Contributing

To contribute features and fixes, create a Git branch for your work:

    git checkout -b my-topic-name

Commit your changes to that branch, then push the topic to GitHub:

    git push -u origin my-topic-name

Due to setting upstream with `-u`, after new commits, you may simply:

    git push

Use the GitHub pull request feature to suggest a topic for inclusion. Use GitHub tools to check for a clean Travis CI build and merge to the `master` branch.

## Notes

If you hit any npm errors in the install process, execute the following and retry the steps:

    sudo rm -rf ~/tmp
    sudo rm -rf ~/.npm
