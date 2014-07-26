cmake_minimum_required(VERSION 2.8.6)

project("Tangelo Hub")

include(CTest)
enable_testing()

find_program(PYTHON_EXECUTABLE python)
find_program(JSHINT_EXECUTABLE jshint ${PROJECT_SOURCE_DIR}/node_modules/jshint/bin)
find_program(TANGELO_EXECUTABLE tangelo)

include(test/JavascriptTests.cmake)
add_subdirectory(test)
