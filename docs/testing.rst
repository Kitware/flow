===============
    Testing
===============

Testing is performed with PhantomJS and uses Python to drive the process and setup a
sandboxed Girder environment. Tests are performed automatically by
`Travis <https://travis-ci.org/Kitware/flow>`_ with resulting test data pushed to a
`CDash dashboard <http://my.cdash.org/index.php?project=Tangelo+Hub>`_.

To initialize the testing environment, create a build folder and run CMake: ::

    mkdir build
    cd build
    cmake ..

Run the tests with CTest. Use ``-V`` for verbose output. ::

    ctest -V
