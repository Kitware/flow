# Set this variable to the minimum coverage percentage to be considered passing
set(COVERAGE_MINIMUM_PASS 80)
set(JS_COVERAGE_MINIMUM_PASS 5)

javascript_tests_init()

add_web_client_test(app "${PROJECT_SOURCE_DIR}/test/spec/appSpec.js")

add_javascript_jscs_test(core app/src)
add_javascript_jshint_test(core app/src)
