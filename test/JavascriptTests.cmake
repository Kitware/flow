function(javascript_tests_init)
  add_test(
    NAME js_coverage_reset
    COMMAND "${PYTHON_EXECUTABLE}"
            "${PROJECT_SOURCE_DIR}/test/js_coverage_tool.py"
            reset
            "${PROJECT_BINARY_DIR}/js_coverage"
  )
  add_test(
    NAME js_coverage_combine_report
    WORKING_DIRECTORY "${PROJECT_BINARY_DIR}"
    COMMAND "${PYTHON_EXECUTABLE}"
            "${PROJECT_SOURCE_DIR}/test/js_coverage_tool.py"
            "--threshold=${JS_COVERAGE_MINIMUM_PASS}"
            "--source=${PROJECT_SOURCE_DIR}"
            combine_report
            "${PROJECT_BINARY_DIR}/js_coverage"
  )
endfunction()

function(add_javascript_jshint_test name input)
  add_test(
    NAME "js_jshint_${name}"
    WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}"
    COMMAND "${JSHINT_EXECUTABLE}" --config "${PROJECT_SOURCE_DIR}/test/jshint.cfg" "${input}"
  )
endfunction()

function(add_javascript_jscs_test name input)
  add_test(
    NAME "js_jscs_${name}"
    WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}"
    COMMAND "${JSCS_EXECUTABLE}" --config "${PROJECT_SOURCE_DIR}/.jscs.json" "${input}"
  )
endfunction()

function(add_web_client_test name specFile)
  set(testname "web_client_${name}")
  add_test(
      NAME ${testname}
      WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}"
      COMMAND "${PYTHON_EXECUTABLE}" -m unittest -v test.web_client_test
  )

  set_property(TEST ${testname} PROPERTY RESOURCE_LOCK mongo cherrypy)
  set_property(TEST ${testname} PROPERTY ENVIRONMENT
    "SPEC_FILE=${specFile}"
    "COVERAGE_FILE=${PROJECT_BINARY_DIR}/js_coverage/${name}.cvg"
    "GIRDER_TEST_DB=girder_test_webclient"
    "GIRDER_TEST_ASSETSTORE=webclient"
    "TANGELO=${TANGELO_EXECUTABLE}"
    "ROOT_DIR=${PROJECT_SOURCE_DIR}"
  )
  set_property(TEST ${testname} APPEND PROPERTY DEPENDS js_coverage_reset)
  set_property(TEST js_coverage_combine_report APPEND PROPERTY DEPENDS ${testname})
endfunction()
