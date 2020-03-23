import React from 'react';
import { styled } from '@material-ui/core/styles';

const Container = styled('div')({
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: ({ legend: { labelFontSize } } = {}) => (
        labelFontSize || '0.6rem'
    ),
    margin: '0.3rem',
});

const Item = styled('div')({
    color: ({ color } = {}) => color,
    flexBasis: '50%',
    padding: '0.15rem 0',
});

export default ({ payload: legends, labelColumn, legend }) => {
    if (legends.length === 1 && legends[0].payload && legends[0].payload.stackId === undefined) {
        legends = legends[0].payload.children;
    }

    return (
        <Container legend="standard-legend">
            {
                legends.map(({ color, payload, value, props: { fill, name: { xVal } = {}}={}} , index) => (
                    <Item key={`legend-${index}`} color={color || fill}>
                        <svg height='0.8rem' width='0.9rem'>
                            <circle cx="7" cy="9" r="3.5" fill={color || fill} />
                        </svg>
                        {(payload && payload[labelColumn] || value) || xVal}
                    </Item>
                ))
            }
        </Container>
    )
}
