import React from 'react';
import { mount, configure } from 'enzyme';
import ReactDOM from 'react-dom';

import { getHtml, getDataAndConfig, checkTicks, checkSvg } from '../testHelper';
import HeatmapGraph from '.';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe("HeatmapGraph", () => {
    let config;
    beforeAll(async () => {
        config = await getDataAndConfig('HeatmapGraph');
    });

    describe("withBrush", () => {
        let withBrush, $;
        beforeAll(async () => {
            withBrush = mount(
                <HeatmapGraph
                    width={500}
                    height={500}
                    configuration={config.withBrush}
                    data={config.data}>
                </HeatmapGraph>
            );
            $ = getHtml(withBrush, '.heatmap');
        });

        it("SVG Dimensions", () => {
            const result = checkSvg(withBrush);
            expect(result).toBeTruthy();
        });

        it("Total Heatmap Block", () => {
            const rect = $('.heatmap').find('g').length;
            expect(rect).toBe(30)
        });

        it("Heatmap First Block Configuration", () => {
            const rect = $('.heatmap').find('g rect').first();
            expect(parseInt(rect.attr('height'))).toBeCloseTo(214);
            expect(parseInt(rect.attr('width'))).toBeCloseTo(57);
        });

        it("Heatmap Null Block Color", () => {
            const rect = $('.heatmap').find('g rect').first();
            expect(rect.attr('style')).toEqual(
                "stroke: grey; stroke-width: 0.5px; fill: #f2f2f2; opacity: 1;"
            );
        });

        it("Heatmap Last Block Configuration", () => {
            const rect = $('.heatmap').find('g rect').last();
            expect(parseInt(rect.attr('height'))).toBeCloseTo(214);
            expect(parseInt(rect.attr('width'))).toBeCloseTo(57);
        });

        it("Heatmap Colored Block Color", () => {
            const rect = $('.heatmap').find('g rect').last();
            expect(rect.attr('style')).toEqual(
                "stroke: grey; stroke-width: 0.5px; fill: #b3d645; opacity: 1;"
            );
        });

        it("xAxis Ticks Length", () => {
            const xAxisTicks = checkTicks(withBrush, '.graph-container', '.xAxis', 'g');
            expect(xAxisTicks).toBe(6);
        });

        it("yAxis Ticks Length", () => {
            const yAxisTicks = checkTicks(withBrush, '.graph-container', '.yAxis', 'g');
            expect(yAxisTicks).toBe(5);
        });

        it("Total Rows in Brush", () => {
            $ = getHtml(withBrush, '.min-heatmap');
            const noOfBars = $('.min-heatmap').find('g').length;
            expect(noOfBars).toBe(5);
        });

        it("Height and Width of Brush Selected Area", () => {
            $ = getHtml(withBrush, '.brush');
            const height = parseFloat($('.brush').find('.selection').attr('height'));
            const width = parseFloat($('.brush').find('.selection').attr('width'));
            expect(height).toEqual(171.6);
            expect(width).toBeCloseTo(-1.70);
        });

        it("Legends", () => {
            $ = getHtml(withBrush, '.legend');
            const legend = $('.legend').children().length;
            expect(legend).toEqual(3);
        });

    });

    describe("withoutBrush", () => {
        let withoutBrush, $;
        beforeAll(async () => {
            withoutBrush = mount(
                <HeatmapGraph
                    width={500}
                    height={500}
                    configuration={config.withoutBrush}
                    data={config.data}>
                </HeatmapGraph>
            );
            $ = getHtml(withoutBrush, '.heatmap');
        });

        it("SVG Dimensions", () => {
            const result = checkSvg(withoutBrush);
            expect(result).toBeTruthy();
        });

        it("Total Heatmap Block", () => {
            const rect = $('.heatmap').find('g').length;
            expect(rect).toBe(30)
        });

        it("Heatmap First Block Configuration", () => {
            const $ = getHtml(withoutBrush, '.heatmap');
            const rect = $('.heatmap').find('g rect').first();
            expect(parseInt(rect.attr('height'))).toBeCloseTo(85);
            expect(parseInt(rect.attr('width'))).toBeCloseTo(61);
        });

        it("Heatmap Null Block Color", () => {
            const rect = $('.heatmap').find('g rect').first();
            expect(rect.attr('style')).toEqual(
                "stroke: grey; stroke-width: 0.5px; fill: #f2f2f2; opacity: 1;"
            );
        });

        it("Heatmap Last Block Configuration", () => {
            const $ = getHtml(withoutBrush, '.heatmap');
            const rect = $('.heatmap').find('g rect').first();
            expect(parseInt(rect.attr('height'))).toBeCloseTo(85);
            expect(parseInt(rect.attr('width'))).toBeCloseTo(61);
        });

        it("Heatmap Colored Block Color", () => {
            const rect = $('.heatmap').find('g rect').last();
            expect(rect.attr('style')).toEqual(
                "stroke: grey; stroke-width: 0.5px; fill: #b3d645; opacity: 1;"
            );
        });

        it("xAxis Ticks Length", () => {
            const xAxisTicks = checkTicks(withoutBrush, '.graph-container', '.xAxis', 'g')
            expect(xAxisTicks).toBe(6);
        });

        it("yAxis Ticks Length", () => {
            const yAxisTicks = checkTicks(withoutBrush, '.graph-container', '.yAxis', 'g')
            expect(yAxisTicks).toBe(5);
        });

        it("Legends", () => {
            $ = getHtml(withoutBrush, '.legend');
            const legend = $('.legend').children().length;
            expect(legend).toEqual(3);
        });
    });

    describe("Click Event", () => {
        let heatmapGraph;
        const mockCallBack = jest.fn();
        const element = document.createElement("div");
        beforeAll((done) => {
            document.body.appendChild(element);
            heatmapGraph = ReactDOM.render(
                <HeatmapGraph
                    width={500}
                    height={500}
                    configuration={config.withoutBrush}
                    data={config.data}
                    onMarkClick={mockCallBack}
                />,
                element
            )
            setTimeout(() => {
                done();
            }, 1000);
        });

        afterAll(() => {
            document.body.removeChild(element);
        });

        it("Click On Bar", () => {
            element.querySelector('rect').click();
            expect(mockCallBack).toHaveBeenCalled();
        });
    });
});