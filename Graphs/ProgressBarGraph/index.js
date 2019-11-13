import React from "react";
import * as d3 from 'd3';
import PropTypes from 'prop-types';

import { properties } from './default.config';
import AbstractGraph from "../AbstractGraph";
import style from './style';

const PERCENTAGE = 'percentage';

export default class ProgressBarGraph extends AbstractGraph {

    constructor(props) {
        super(props, properties);
    }

    getWidth = (barData, width) => {
        const {
            maxData,
            usedData,
        } = this.getConfiguredProperties();

        return barData[maxData] ? width * barData[usedData] / barData[maxData] : width * barData[usedData] * 0.01;
    }

    getData = (dataFromProps) => {
        const barData = {...dataFromProps};
        const {
            maxData,
            usedData,
            display,
            maxDataFormat,
            defaultRange,
            units
        } = this.getConfiguredProperties();

        if (display === PERCENTAGE) {
            const data = barData[maxData] ? parseInt(barData[usedData] * 100 / barData[maxData]) : barData[usedData];
            return `${data}%`;
        }

        barData[usedData] = d3.format(maxDataFormat)(barData[usedData]);
        barData[maxData] = barData[maxData] ? d3.format(maxDataFormat)(barData[maxData]) : undefined;
        const dataUnits = barData['unit'] || units ? ` ${barData['unit']||units}` : '';

        return barData[maxData] ? `${barData[usedData]}${dataUnits}/ ${barData[maxData]}${dataUnits}` : `${barData[usedData]}${dataUnits}/ ${defaultRange}${dataUnits}`;
    }

    getPercentage = (barData, width) => {
        const {
            maxData,
            usedData,
        } = this.getConfiguredProperties();

        return barData[maxData] ? (width * barData[usedData] / barData[maxData]) * 100 / width : barData[usedData];
    }

    getColor = (barData, width) => {
        const {
            barColor,
            colorRange,
        } = this.getConfiguredProperties();

        let setColor = false;

        if (colorRange) {
            const percentage = this.getPercentage(barData, width);
            let colorData;
            colorRange.filter((d) => {
                if (percentage <= d['upto'] && !setColor) {
                    setColor = true;
                    colorData = d;
                }
            });

            return colorData['color'];
        }

        return barColor;
    }

    render() {
        const {
            data,
            width,
            height,
        } = this.props;

        const {
            margin,
            label,
            display,
            chartWidthToPixel,
            minSectionHeight,
            backgroundColor,
        } = this.getConfiguredProperties();

        if (!data.length) {
            return this.renderMessage('No data to visualize');
        }

        const availableWidth = width - (margin.left + margin.right);
        let barWidth = availableWidth;
        if (display === PERCENTAGE) {
            const labelWidth = this.longestLabelLength(data, (d) => this.getData(d)) * chartWidthToPixel;
            barWidth = availableWidth - labelWidth * 1.30;
        }

        let sectionHeight = height / (data.length + 1);
        const barHeight = (display === PERCENTAGE) ? (sectionHeight * 0.60) : sectionHeight * 0.50;

        let textWidth;
        if (sectionHeight < minSectionHeight) {
            sectionHeight = minSectionHeight;     
            if(display !== PERCENTAGE) {
                textWidth = this.longestLabelLength(data);
                barWidth = availableWidth - textWidth;
            }      
        }

        return (
            <div
                className="progress-graph"
                style={{
                    width: availableWidth,
                    height,
                    marginLeft: margin.left,
                    marginRight: margin.right,
                    ...style.container
                }}
            >
                {
                    data.map((d, i) => {
                        return (
                            <div
                                key={i}
                                style={{
                                    height: sectionHeight,
                                    width: availableWidth,        
                                    ...style.section
                                }}
                            >
                                <div style={style.upperText}> {d[label]} </div>
                                <div style={{
                                    ...style.barSection,
                                    flexDirection: (display === PERCENTAGE) ? 'row' : 'column',
                                }}>
                                    <div style={{
                                        height: barHeight,
                                        ...style.innerBarSection
                                    }}>
                                        <div>{this.tooltip}</div>
                                        <svg style={{ width: barWidth, height: barHeight }}>
                                            <g>
                                                <rect
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={backgroundColor}
                                                    {...this.tooltipProps(d)}
                                                />
                                                <rect
                                                    width={this.getWidth(d, barWidth)}
                                                    height={barHeight}
                                                    fill={this.getColor(d, barWidth)}
                                                    {...this.tooltipProps(d)}
                                                />
                                            </g>
                                        </svg>
                                    </div>
                                    <div style={{
                                        ...style.lowerText,
                                        alignSelf: (display === PERCENTAGE) ? 'center' : 'flex-end',
                                        marginRight: (sectionHeight === minSectionHeight) ? textWidth * 1.25 : margin.right,
                                    }}>
                                        {this.getData(d)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

ProgressBarGraph.propTypes = {
    configuration: PropTypes.object,
    data: PropTypes.arrayOf(PropTypes.object),
};

ProgressBarGraph.defaultProps = {
    width: 100,
    height: 100,
    data: [],
    configuration: {}
};

