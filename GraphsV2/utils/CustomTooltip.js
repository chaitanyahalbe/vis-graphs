import React from 'react';
import { styled } from '@material-ui/core/styles';

const Container = styled('div')({
    marginLeft: '0.5rem',
    marginRight: '0.5rem',
});

const Item = styled('p')({
    color: 'white',
});

export default ({ active, payload, label, tooltip }) => {
    if (!active) {
        return null;
    }

    return (
        <Container>
            {tooltip && payload.length && tooltip.map((element, index) => (
                <Item className="label">
                    {element.label || element.column} : {payload[0]['payload'][element.column]}
                </Item>
            ))}
        </Container>
    );
}
