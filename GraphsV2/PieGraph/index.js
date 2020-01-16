import PropTypes from 'prop-types';
import React from 'react';
import { config } from './default.config';
import { compose } from 'redux';
import {
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip
} from 'recharts';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

import { 
    PERCENTAGE,
    STANDARD
} from './../../constants';

import WithConfigHOC from '../../HOC/WithConfigHOC';
import ValiddataHOC from '../../HOC/ValiddataHOC';
import CustomTooltip from '../utils/CustomTooltip';
import GraphLegend from '../utils/Legends/';
import { filterEmptyData } from "../../utils/helpers";
import { limit } from '../../utils/helpers/limit';

const colors = scaleOrdinal(schemeCategory10).range();

const PieGraph = (props) => {
    const {
        data: originalData,
        width,
        height,
        properties,
        onMarkClick
    } = props;

    const {
        otherOptions,
        labelColumn,
        pieInnerRadius,
        pieOuterRadius,
        showZero,
        sliceColumn,
        legend,
        tooltip,
        percentages
    } = properties;

    const settings = {
        "metric": sliceColumn,
        "dimension": labelColumn,
        "limitOption": otherOptions
    };

    const data = limit({
        data: filterEmptyData({
            data: originalData,
            column: sliceColumn,
            showZero: showZero
        }),
        ...settings
    });

    const type = percentages ? PERCENTAGE : STANDARD;
    const legendHeight = (legend.separate * height) / 100;

    return (
        <PieChart
            width={width}
            height={height}
            cursor={onMarkClick ? "pointer" : ''}
        >
            {
                legend && legend.show && (
                    <Legend
                        wrapperStyle={{ overflowY: 'auto', height: legendHeight }}
                        content={(props) => (
                            <GraphLegend
                                labelColumn={labelColumn}
                                legend={legend}
                                type={type}
                                {...props}
                            />
                        )}
                    />
                )
            }
            {
                tooltip && (
                    <Tooltip
                        content={<CustomTooltip tooltip={tooltip} />}
                        wrapperStyle={{ backgroundColor: "black" }}
                    />
                )
            }
            <Pie
                labelLine={false}
                data={data}
                innerRadius={pieInnerRadius * 100}
                outerRadius={pieOuterRadius * 100}
                dataKey={sliceColumn}
                onClick={
                    (d) => (
                        onMarkClick && (!otherOptions || d[labelColumn] !== otherOptions.label)
                            ? onMarkClick(d)
                            : ''
                    )
                }
            >
                {
                    data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))
                }
            </Pie>
        </PieChart>
    );
}

PieGraph.propTypes = {
    configuration: PropTypes.object
};

export default compose(
    ValiddataHOC(),
    (WithConfigHOC(config))
)(PieGraph);
