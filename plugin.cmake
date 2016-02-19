add_web_client_test(
    flow "${PROJECT_SOURCE_DIR}/plugins/flow/web_client/tests/spec/flowSpec.js"
    PLUGIN flow
    BASEURL "/static/built/plugins/flow/testEnvFlow.html")
