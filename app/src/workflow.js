/*jslint browser: true, unparam: true, nomen: true */
/*globals d3, $, _ */

var workflow;
workflow = function (selection) {
    "use strict";

    var that,
        workflow,
        drag,
        dragPort,
        svg,
        vis,
        outputStep,
        outputIndex,
        conn,
        stepMap,
        dragConnection,
        dragPath,
        portOffset = 20,
        strokeColor = "#333";

    // Update the SVG path for a connection
    function connectionPath(d) {
        var dist,
            delta,
            offset;
        delta = [d.outputStep.x - d.inputStep.x, d.outputStep.y - d.inputStep.y];
        dist = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);
        offset = 0.4 * dist - 50;
        offset = offset < 0 ? 0 : offset;
        return "M " + (d.outputStep.x + 150 + portOffset) + " " + (d.outputStep.y + d.outputPos)
            + " C " + (d.outputStep.x + 150 + portOffset + offset) + " " + (d.outputStep.y + d.outputPos)
            + " " + (d.inputStep.x  - portOffset - offset) + " " + (d.inputStep.y + d.inputPos)
            + " " + (d.inputStep.x - portOffset) + " " + (d.inputStep.y + d.inputPos);
    }

    function updateConnections() {
        function connectionKey(d) {
            return d.inputStep.id
                + "$"
                + d.inputIndex
                + "$"
                + d.outputStep.id
                + "$"
                + d.outputIndex;
        }
        conn.selectAll("path").data(workflow.connections, connectionKey).enter().append("path")
            .style("stroke", strokeColor)
            .style("stroke-width", 10)
            .style("fill", "none")
            .attr("d", connectionPath);
        conn.selectAll("path").data(workflow.connections, connectionKey).exit().remove();
    }

    function updateStep(step) {

        function portShape(type, x, y) {
            if (type === "table") {
                return "M " + x + " " + y
                    + "m -10, -10"
                    + "l 20, 0"
                    + "l 0, 20"
                    + "l -20, 0"
                    + "Z";
            }
            if (type === "tree") {
                return "M " + x + " " + y
                    + "m -10, 10"
                    + "l 20, 0"
                    + "l -10, -20"
                    + "Z";
            }
            return "M " + x + " " + y
                + " m -10,0"
                + " a 10,10 0 1,0 20,0"
                + " a 10,10 0 1,0 -20,0";
        }

        d3.select(this).selectAll("path.input-line")
            .data(step.inputs)
            .enter().append("path")
            .classed("input-line", true)
            .attr("d", function (d, i) { return "M 0 " + step.inputScale(i) + "l " + -portOffset + " 0"; })
            .style("stroke", strokeColor)
            .style("stroke-width", 2);

        d3.select(this).selectAll("path.output-line")
            .data(step.outputs)
            .enter().append("path")
            .classed("output-line", true)
            .attr("d", function (d, i) { return "M 150 " + step.outputScale(i) + "l " + portOffset + " 0"; })
            .style("stroke", strokeColor)
            .style("stroke-width", 2);

        d3.select(this).selectAll("path.input").data(step.inputs).enter().append("path")
            .classed("input", true)
            .attr("d", function (d, i) { return portShape(d.type, -portOffset, step.inputScale(i)); })
            .style("fill", "whitesmoke")
            .style("stroke", strokeColor)
            .style("stroke-width", 2)
            .on("click", function (d, i) {
                // Create an input node
                var input = {
                        name: d.name,
                        isInput: true,
                        inputs: [],
                        outputs: [_.clone(d)]
                    },
                    inStep = that.add(input);

                workflow.connections.push({
                    outputStep: inStep,
                    outputIndex: 0,
                    outputPos: inStep.outputScale(0),
                    inputStep: step,
                    inputIndex: i,
                    inputPos: step.inputScale(i)
                });
                that.update();
            })
            .on("mouseover", function (d) { d3.select(this).style("fill", "#428BCA"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "whitesmoke"); })
            .on("mouseup", function (d, i) {
                var existing;
                if (outputStep !== undefined
                        && outputStep.outputs[outputIndex].type === step.inputs[i].type) {

                    // Remove any existing connection to this input
                    workflow.connections.forEach(function (c, ci) {
                        if (c.inputStep === step && c.inputIndex === i) {
                            existing = ci;
                        }
                    });
                    if (existing !== undefined) {
                        workflow.connections.splice(existing, 1);
                    }

                    // Add the new connection
                    workflow.connections.push({
                        outputStep: outputStep,
                        outputIndex: outputIndex,
                        outputPos: outputStep.outputScale(outputIndex),
                        inputStep: step,
                        inputIndex: i,
                        inputPos: step.inputScale(i)
                    });
                    updateConnections();
                    outputStep = undefined;
                    outputIndex = undefined;
                }
            });

        d3.select(this).selectAll("path.output").data(step.outputs).enter().append("path")
            .classed("output", true)
            .attr("d", function (d, i) { return portShape(d.type, 150 + portOffset, step.outputScale(i)); })
            .style("fill", "#eee")
            .style("stroke", strokeColor)
            .style("stroke-width", 2)
            .on("click", function (d, i) {
                // Create an output node
                var output = {
                        name: d.name,
                        isOutput: true,
                        inputs: [_.clone(d)],
                        outputs: []
                    },
                    outStep = that.add(output);

                workflow.connections.push({
                    outputStep: step,
                    outputIndex: i,
                    outputPos: step.outputScale(i),
                    inputStep: outStep,
                    inputIndex: 0,
                    inputPos: outStep.inputScale(0)
                });
                that.update();
            })
            .on("mouseover", function (d) { d3.select(this).style("fill", "#428BCA"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "whitesmoke"); })
            .on("mousedown", function (o, i) {
                outputStep = step;
                outputIndex = i;
                dragConnection = {
                    outputStep: step,
                    outputPos: outputStep.outputScale(i),
                    inputStep: {x: step.x + 150 + portOffset + 20, y: step.y + step.outputScale(i)},
                    inputPos: 0
                };
                d3.event.stopPropagation();
            })
            .call(dragPort);
    }

    function updateSteps() {
        var g = vis.selectAll("g.step").data(workflow.steps, function (d) { return d.id; })
            .enter().append("g")
            .classed("step", true);

        vis.selectAll("g.step").data(workflow.steps, function (d) { return d.id; })
            .exit().remove();

        g.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .call(drag);

        g.append("rect")
            .attr("width", 150)
            .attr("height", 100)
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", "whitesmoke")
            .style("stroke", strokeColor)
            .style("stroke-width", 2);

        g.append("text")
            .attr("x", 75)
            .attr("y", 50)
            .style("fill", strokeColor)
            .style("text-anchor", "middle")
            .style("alignment-baseline", "central")
            .text(function (d) { return d.id; })
            .style("user-select", "none")
            .style("-webkit-user-select", "none")
            .style("pointer-events", "none");

        g.each(updateStep);

        vis.selectAll("g.step").selectAll("rect")
            .style("fill", "whitesmoke");
    }

    that = {};

    that.clear = function () {
        stepMap = {};
        workflow = {name: "New Workflow", inputs: [], outputs: [], steps: [], connections: []};
        that.update();
    };

    that.add = function (a) {
        var count,
            step = {
                x: (a.x === undefined ? 200 : a.x),
                y: (a.y === undefined ? 200 : a.y),
                id: a.name,
                inputs: a.inputs,
                outputs: a.outputs,
                analysis: a
            };
        step.inputScale = d3.scale.linear().domain([0, a.inputs.length - 1]).range([25, 75]);
        step.outputScale = d3.scale.linear().domain([0, a.outputs.length - 1]).range([25, 75]);
        step.inputMap = {};
        step.inputs.forEach(function (inp, i) {
            step.inputMap[inp.name] = i;
        });
        step.outputMap = {};
        step.outputs.forEach(function (out, i) {
            step.outputMap[out.name] = i;
        });
        count = 1;
        while (stepMap[step.id] !== undefined) {
            step.id = a.name + " " + count;
            count += 1;
        }
        stepMap[step.id] = step;
        workflow.steps.push(step);
        updateSteps();
        return step;
    };

    that.data = function (d) {
        if (d === undefined) {
            return workflow;
        }
        that.clear();

        d.inputs.forEach(function (input) {
            // Create an input node
            that.add({
                x: input.x,
                y: input.y,
                name: input.name,
                isInput: true,
                inputs: [],
                outputs: [_.clone(input)]
            });
        });

        d.outputs.forEach(function (output) {
            // Create an output node
            that.add({
                x: output.x,
                y: output.y,
                name: output.name,
                isOutput: true,
                inputs: [_.clone(output)],
                outputs: []
            });
        });

        d.steps.forEach(function (step) {
            var s = _.clone(step.analysis);
            s.x = step.x;
            s.y = step.y;
            s.name = step.id;
            that.add(s);
        });

        d.connections.forEach(function (conn) {
            var outStep = stepMap[conn.output_step],
                inStep = stepMap[conn.input_step],
                inIndex,
                outIndex;
            if (outStep === undefined) {
                outStep = stepMap[conn.name];
                outIndex = 0;
            } else {
                outIndex = outStep.outputMap[conn.output];
            }
            if (inStep === undefined) {
                inStep = stepMap[conn.name];
                inIndex = 0;
            } else {
                inIndex = inStep.inputMap[conn.input];
            }
            workflow.connections.push({
                outputStep: outStep,
                outputIndex: outIndex,
                outputPos: outStep.outputScale(outIndex),
                inputStep: inStep,
                inputIndex: inIndex,
                inputPos: inStep.inputScale(inIndex)
            });
        });

        that.update();
    };

    // Convert workflow to pure JSON (no references) for serialization
    that.serialize = function () {
        var serialized = {name: workflow.name, inputs: [], outputs: [], steps: [], connections: []};
        workflow.steps.forEach(function (step) {
            var input, output;
            if (step.analysis.isInput) {
                input = _.clone(step.analysis.outputs[0]);
                input.x = step.x;
                input.y = step.y;
                input.name = step.id;
                serialized.inputs.push(input);
            } else if (step.analysis.isOutput) {
                output = _.clone(step.analysis.inputs[0]);
                output.x = step.x;
                output.y = step.y;
                output.name = step.id;
                serialized.outputs.push(output);
            } else {
                serialized.steps.push({
                    x: step.x,
                    y: step.y,
                    id: step.id,
                    analysis: step.analysis
                });
            }
        });
        workflow.connections.forEach(function (c) {
            if (c.outputStep.analysis.isInput) {
                serialized.connections.push({
                    name: c.outputStep.id,
                    input_step: c.inputStep.id,
                    input: c.inputStep.inputs[c.inputIndex].name
                });
            } else if (c.inputStep.analysis.isOutput) {
                serialized.connections.push({
                    name: c.inputStep.id,
                    output_step: c.outputStep.id,
                    output: c.outputStep.outputs[c.outputIndex].name
                });
            } else {
                serialized.connections.push({
                    output_step: c.outputStep.id,
                    output: c.outputStep.outputs[c.outputIndex].name,
                    input_step: c.inputStep.id,
                    input: c.inputStep.inputs[c.inputIndex].name
                });
            }
        });
        return serialized;
    };

    that.update = function () {
        updateSteps();
        updateConnections();
    };

    function zoom() {
        vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // Create main SVG object
    svg = selection.append("svg").append("g");

    // Overlay to capture mouse events
    // Add zoom behavior a la http://bl.ocks.org/mbostock/3680999
    svg.append("rect")
        .attr("class", "overlay")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("width", $(selection.node()).width())
        .attr("height", $(selection.node()).height())
        .call(d3.behavior.zoom().scaleExtent([0.25, 8]).on("zoom", zoom));

    // Vis group for everything else
    vis = svg.append("g");

    // Create group containing all connections
    conn = vis.append("g");

    // Create path for dragged path
    dragPath = vis.append("path")
        .style("stroke", strokeColor)
        .style("stroke-width", 10)
        .style("fill", "none");

    // Define behavior for dragging analysis "g" elements
    drag = d3.behavior.drag()
        .on("drag", function (d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            d3.select(this)
                .attr("transform", "translate(" + d.x + "," + d.y + ")");

            conn.selectAll("path")
                .attr("d", connectionPath);
        });

    // Define behavior for dragging output port elements
    dragPort = d3.behavior.drag()
        .on("dragstart", function (d) {
            dragPath.attr("visibility", "visible");
            dragPath.attr("d", connectionPath(dragConnection));
        })
        .on("drag", function (d) {
            dragConnection.inputStep.x += d3.event.dx;
            dragConnection.inputStep.y += d3.event.dy;
            dragPath.attr("d", connectionPath(dragConnection));
        })
        .on("dragend", function (d) {
            dragPath.attr("visibility", "hidden");
        });

    // Start with an empty workflow
    that.clear();

    return that;
};
