TangeloHub [![Build Status](https://travis-ci.org/tangelo-hub/tangelo-hub.png?branch=master)](https://travis-ci.org/tangelo-hub/tangelo-hub)
===========

## Local development setup

The TangeloHub application requires several components, including [Girder](http://girder.readthedocs.org/en/latest/installation.html). Follow the link for install instructions. After following the Girder install, you should also have a MongoDB instance running on your machine.

We also need the Romanesco Girder plugin and web interface. To install them, use the `girder-install` command:

    sudo girder-install -f web
    git clone https://github.com/arborworkflows/romanesco.git
    sudo girder-install -f plugin -s ./romanesco

Install an appropriate Girder config file:

    sudo cp tangelo-hub/devops/local/girder.local.cfg path/to/site-packages/girder/conf/

You can find your `path/to/site-packages` with:

    python
    >>> import site
    >>> site.getsitepackages()

Start Girder:

    python -m girder

Running the Romanesco worker requires that you first install [R](http://www.r-project.org/). After you have R installed, start a Romanesco worker with:

    cd romanesco
    sudo pip install -r requirements.txt
    python -m romanesco

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

Use something like the following Apache file in the `sites-available` folder (you can simply replace the `default` file there):

```
Listen 9080

<VirtualHost *:9080>
    DocumentRoot /path/to/tangelo-hub/app
    ProxyPass /girder http://localhost:9000
    ProxyPassReverse /girder http://localhost:9000
</VirtualHost>
```

After restarting Apache (`sudo apache2ctl restart`), visit your Girder web interface at [http://localhost:9080/girder](http://localhost:9080/girder) to enable the Romanesco plugin from the admin console. A restart of Girder is required to fully enable the Romanesco plugin.

Now you should be able to visit the running TangeloHub instance at [http://localhost:9080](http://localhost:9080).

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
