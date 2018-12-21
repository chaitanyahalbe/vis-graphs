import React from 'react';
import PropTypes from 'prop-types';
import objectPath from 'object-path';
import _ from 'lodash';

import XYGraph from '../XYGraph';
import columnAccessor from '../../utils/columnAccessor';
import { properties } from './default.config';
import styles from './styles';


class PortGraph extends XYGraph {

    constructor(props) {
        super(props, properties);

        this.isMultipleRows = false;
        this.state = {
            portAreaWidth: 100,
            rowCount: 0,
        }
    }

    componentWillMount() {
        this.initiate(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.initiate(nextProps);
    }

    initiate(props) {
        this.checkMultipleRows(props);
        this.setPortAreaWidth(props);
        this.setRowCount(props);
    }


    // to check whether there are multiple rows or a single row
    checkMultipleRows(props) {
        const { data } = props;
        const { rowLimit } = this.getConfiguredProperties();

        this.isMultipleRows = data.length > rowLimit;
    }

    hasMultipleRows() {
        return this.isMultipleRows;
    }

    // calculate the width of each port section
    setPortAreaWidth(props) {
        const { data, width } = props;
        const { rowLimit, minPortWidth } = this.getConfiguredProperties();
        const portWidth = width / (this.hasMultipleRows() ? rowLimit : data.length);

        this.setState({ portAreaWidth: portWidth < minPortWidth ? minPortWidth : portWidth });
    }

    // calculate length of the row to show number of ports in each row. 
    setRowCount(props) {
        const { data } = props;
        const { rowLimit } = this.getConfiguredProperties();

        this.setState({ rowCount: this.hasMultipleRows() ? rowLimit : data.length });
    }

    // Get the color of the port icons based on the field's value set in configuration.
    getIconColor(row) {
        const {
            portColor,
            defaultIconColor
        } = this.getConfiguredProperties();

        if (portColor && typeof portColor === 'object' && portColor.field) {
            let color = portColor.defaultColor || defaultIconColor;
            portColor.criteria.forEach(d => {
                if (d.value === objectPath.get(row, portColor.field)) {
                    color = d.color;
                }
            });

            return color;
        }

        return defaultIconColor;
    }

    // calculate the font size of port icon.
    calculatePortFontSize() {
        const { minPortFontSize, maxPortFontSize } = this.getConfiguredProperties();
        const font = this.state.portAreaWidth * 0.4;

        return font > maxPortFontSize ? maxPortFontSize : (font < minPortFontSize ? minPortFontSize : font);
    }

    // get port name
    getPortAttribute(row = {}, attributeType) {
        const configuration = this.getConfiguredProperties();

        const attribute = configuration[attributeType];

        return objectPath.get(row, attribute) || '';
    }

    // icon to show port status
    getIcon(row) {
        const fontSize = this.calculatePortFontSize();
        return (
            <svg
                style={{ cursor: 'pointer' }}
                data-tip={true}
                data-for={this.tooltipId}
                onMouseMove={() => this.hoveredDatum = row}
                width={fontSize}
                height={fontSize}
                viewBox="107.618 156.5 1830.713 1629.989"
            >
                <polyline
                    fill={this.getIconColor(row)}
                    points="107.618,156.5 1938.331,156.5 1938.331,1175.243 1709.492,1175.243 1709.492,1481.138 1480.653,1481.138 1480.653,1786.489 565.296,1786.489 565.296,1490.638 336.457,1490.638 336.457,1180.304 107.618,1180.304 "
                />
            </svg>
        )
    }

    processPortRowset() {
        const { data } = this.props;
        const { rowLimit } = this.getConfiguredProperties();

        return _.chunk(data, rowLimit);
    }

    renderGraph() {

        const nextRow = this.hasMultipleRows();
        const portRowset = this.processPortRowset();
        const { rowCount } = this.state;

        return (
            <div style={{
                ...styles.iconContainer,
                justifyContent: nextRow ? 'flex-start' : 'space-between',
            }}>
                {
                    portRowset.map((portRow, index) => {
                        return (
                            <div
                                key={index}
                                style={styles.row}
                            >
                                {
                                    portRow.map((data, i) => {
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    ...styles.portBox,
                                                    minWidth: this.state.portAreaWidth,
                                                }}
                                            >
                                                {this.getPortAttribute(data, 'topColumn')}
                                                <div style={{ borderRight: (i % rowCount) < (rowCount - 1) ? styles.borderRight : '' }}>
                                                    {this.getIcon(data)}
                                                </div>
                                                {this.getPortAttribute(data, 'bottomColumn')}
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        )
                    })}
            </div>
        );
    }

    // show "key: value" data in top section of the graph
    renderColumns() {
        const { data2 } = this.props;
        const { columns } = this.getConfiguredProperties();

        let columnData = null;
        if (columns && columns.length && data2.length) {
            columnData = (
                columns.map(column => {
                    const accessor = columnAccessor(column);
                    return data2.map(d => {
                        return (
                            <div style={styles.labelBox}>
                                <strong> {column.label || column.column}: </strong>
                                {accessor(d)}
                            </div>
                        );
                    });
                })
            )
        }

        return (
            <div style={styles.labelContainer}>
                {columnData}
            </div>
        )
    }

    render() {
        const {
            data,
            width,
            height,
        } = this.props;

        if (!data.length) {
            return this.renderMessage('No data to visualize');
        }

        return (
            <div className='port-graph'>
                <div>{this.tooltip}</div>
                <div style={{ width, height, ...styles.container }}>
                    {this.renderColumns()}
                    {this.renderGraph()}
                </div>
            </div>
        )
    }
}


PortGraph.defaultProps = {
    data: [],
    data2: []
};

PortGraph.propTypes = {
    data: PropTypes.array,
    height: PropTypes.number,
    width: PropTypes.number,
};

export default PortGraph;
