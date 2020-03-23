import React from 'react';
const cheerio = require('cheerio');
import ReactDom from 'react-dom';

import { getDataAndConfig } from '../testHelper';
import LineGraph from '.';

describe('LineGraph', () => {
  let config

  beforeAll(async () => {
    config = await getDataAndConfig('LineGraph');
  })

  describe("Multi Lines", () => {
    let multiLine, $;
    const element = document.createElement("div");

    beforeAll((done) => {
      document.body.appendChild(element);
      multiLine = ReactDom.render(
        <LineGraph
          width={500}
          height={500}
          configuration={config.multiline}
          data={config.data}>
        </LineGraph>,
        element
      );
      setTimeout(() => {
        done();
        $ = cheerio.load(element.innerHTML);
      }, 3000);
    });

    it("SVG Dimensions", () => {
      const height = $('svg').attr('height');
      const width = $('svg').attr('width');
      expect(height).toEqual("500");
      expect(width).toEqual("500");
    });

    it("Total LineGraphs", () => {
      const noOfLines = $('svg').find('.line-graph-line').length;
      expect(noOfLines).toBe(4);
    });

    it("xAxis Ticks Length", () => {
      const xAxisTicks = $('.recharts-xAxis').find('.graph-axis').length;
      expect(xAxisTicks).toBe(4);
    });

    it("yAxis Ticks Length", () => {
      const yAxisTicks = $('.recharts-yAxis').find('.graph-axis').length;
      expect(yAxisTicks).toBe(5);
    });

    it("Number of Legends", () => {
      const noOfLegends = $('.recharts-legend-wrapper').find('div').find('div').length;
      expect(noOfLegends).toBe(4);
    });

  });

  describe("Simple LineGraph", () => {
    let simple, $;
    const element = document.createElement("div");

    beforeAll((done) => {
      document.body.appendChild(element);
      simple = ReactDom.render(
        <LineGraph
          width={500}
          height={500}
          configuration={config.simple}
          data={config.data}>
        </LineGraph>,
        element
      );
      setTimeout(() => {
        done();
        $ = cheerio.load(element.innerHTML);
      }, 3000);
    });

    it("SVG Dimensions", () => {
      const height = $('svg').attr('height');
      const width = $('svg').attr('width');
      expect(height).toEqual("500");
      expect(width).toEqual("500");
    });

    it("Total LineGraphs", () => {
      const noOfLines = $('svg').find('.line-graph-line').length;
      expect(noOfLines).toBe(4);
    });

    it("xAxis Ticks Length", () => {
      const xAxisTicks = $('.recharts-xAxis').find('.graph-axis').length;
      expect(xAxisTicks).toBe(4);
    });

    it("yAxis Ticks Length", () => {
      const yAxisTicks = $('.recharts-yAxis').find('.graph-axis').length;
      expect(yAxisTicks).toBe(5);
    });

    it("Number of Legends", () => {
      const noOfLegends = $('.recharts-legend-wrapper').find('div').find('div').length;
      expect(noOfLegends).toBe(4);
    });
  });

  describe("Simple LineGraph With Ycolumn ", () => {
    let simpleYcolumn, $;
    const element = document.createElement("div");

    beforeAll((done) => {
      document.body.appendChild(element);
      simpleYcolumn = ReactDom.render(
        <LineGraph
          width={500}
          height={500}
          configuration={config.simpleYcolumn}
          data={config.data}>
        </LineGraph>,
        element
      );
      setTimeout(() => {
        done();
        $ = cheerio.load(element.innerHTML);
      }, 3000);
    });

    it("SVG Dimensions", () => {
      const height = $('svg').attr('height');
      const width = $('svg').attr('width');
      expect(height).toEqual("500");
      expect(width).toEqual("500");
    });

    it("Total LineGraphs", () => {
      const noOfLines = $('svg').find('.line-graph-line').length;
      expect(noOfLines).toBe(4);
    });

    it("xAxis Ticks Length", () => {
      const xAxisTicks = $('.recharts-xAxis').find('.graph-axis').length;
      expect(xAxisTicks).toBe(4);
    });

    it("yAxis Ticks Length", () => {
      const yAxisTicks = $('.recharts-yAxis').find('.graph-axis').length;
      expect(yAxisTicks).toBe(5);
    });

    it("Number of Legends", () => {
      const noOfLegends = $('.recharts-legend-wrapper').find('div').find('div').length;
      expect(noOfLegends).toBe(4);
    });

  });

  describe("Multi Line LineGraph With Ycolumn", () => {
    let multilineYcolumn, $;
    const element = document.createElement("div");

    beforeAll((done) => {
      document.body.appendChild(element);
      multilineYcolumn = ReactDom.render(
        <LineGraph
          width={500}
          height={500}
          configuration={config.multilineYcolumn}
          data={config.data}>
        </LineGraph>,
        element
      );
      setTimeout(() => {
        done();
        $ = cheerio.load(element.innerHTML);
      }, 3000);
    });

    it("SVG Dimensions", () => {
      const height = $('svg').attr('height');
      const width = $('svg').attr('width');
      expect(height).toEqual("500");
      expect(width).toEqual("500");
    });

    it("Total LineGraphs", () => {
      const noOfLines = $('svg').find('.line-graph-line').length;
      expect(noOfLines).toBe(4);
    });

    it("xAxis Ticks Length", () => {
      const xAxisTicks = $('.recharts-xAxis').find('.graph-axis').length;
      expect(xAxisTicks).toBe(4);
    });

    it("yAxis Ticks Length", () => {
      const yAxisTicks = $('.recharts-yAxis').find('.graph-axis').length;
      expect(yAxisTicks).toBe(5);
    });

    it("Number of Legends", () => {
      const noOfLegends = $('.recharts-legend-wrapper').find('div').find('div').length;
      expect(noOfLegends).toBe(4);
    });

  });
});
