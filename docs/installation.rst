====================
    Installation
====================

The TangeloHub application requires several components, as well as the main
TangeloHub source.

You need one of
`tangelo <http://tangelo.readthedocs.org/en/latest/installation.html>`_,
`Apache <http://httpd.apache.org/>`_, or
`nginx <http://nginx.org/>'_.  These instructions are for Apache.

Check out the TangeloHub repository. As a team developer: ::

    git clone git@github.com:Kitware/tangelohub.git

Or as a contributor: ::

    git clone https://github.com/Kitware/tangelohub.git

Next, install `Girder
<http://girder.readthedocs.org/en/latest/installation.html>`_.  Follow the link
for install instructions.  After following the Girder install, you will also
have a MongoDB instance running on your machine. The simplest Girder install
consists of a `pip` install. Ensure you have an updated `pip` then install
Girder: ::

    sudo pip install -U pip
    sudo pip install girder

Install `R <http://www.r-project.org/>`_.  R is needed in order to install
and use Romanesco.

We need the Romanesco Girder plugin and web interface.  To install them, use
the ``girder-install`` command: ::

    sudo girder-install -f web
    git clone https://github.com/Kitware/romanesco.git
    sudo girder-install -f plugin -s ./romanesco

Install an appropriate Girder config file: ::

    sudo cp tangelohub/devops/ansible/girder.local.cfg path/to/site-packages/girder/conf/

You can find your ``path/to/site-packages`` with: ::

    python
    >>> import site
    >>> site.getsitepackages()

Start Girder: ::

    python -m girder &

Start a Romanesco worker with: ::

    cd romanesco
    sudo pip install -r requirements.txt
    python -m romanesco &

TangeloHub requires npm and Grunt, which should already have been
installed as part of the Girder installation: ::

    curl -sL https://deb.nodesource.com/setup | sudo bash -
    sudo apt-get install nodejs
    sudo npm install -g grunt

Enter the source folder and build out all the npm dependencies: ::

    cd tangelohub
    npm install

If you modify the TangeloHub source, you can rebuild the app: ::

    ./node_modules/.bin/grunt init
    ./node_modules/.bin/grunt

If you are using Apache, use something like the following file in the
``sites-available`` folder (you can simply replace the `default` file there):

.. code-block:: apacheconf

    Listen 9080

    <VirtualHost *:9080>
        DocumentRoot /path/to/tangelohub/app
        ProxyPass /girder http://localhost:9000
        ProxyPassReverse /girder http://localhost:9000
    </VirtualHost>

You will need the proxy and proxy_html Apache modules: ::

    a2enmod proxy
    a2enmod proxy_http

After restarting Apache (``sudo apache2ctl restart``), visit your Girder web
interface at `http://localhost:9080/girder <http://localhost:9080/girder>`_ to
enable the Romanesco plugin from the admin console.  A restart of Girder is
required to fully enable the Romanesco plugin.

Now you should be able to visit the running TangeloHub instance at
`http://localhost:9080 <http://localhost:9080>`_.
