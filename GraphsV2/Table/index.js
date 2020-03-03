import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react'
import { compose } from 'redux';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Tooltip } from 'react-lightweight-tooltip';
import { first, last, isEqual, orderBy, isEmpty, uniq } from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import objectPath from "object-path";
import IconButton from 'material-ui/IconButton';
import RefreshIcon from 'material-ui/svg-icons/navigation/refresh';
import { FaRegEye as EyeIcon, FaRegClipboard } from 'react-icons/fa';

import WithConfigHOC from '../../HOC/WithConfigHOC';
import WithValidationHOC from '../../HOC/WithValidationHOC';
import columnAccessor from "../../utils/columnAccessor";
import { toolTipStyle, lastColToolTipStyle, firstColToolTipStyle } from './tooltipStyle';
import "./style.css";
import style from './style';
import { properties } from "./default.config";
import { expandExpression, labelToField } from '../../utils/helpers';
import { events } from '../../utils/types';
import SearchBar from "../../SearchBar";
import InfoBox from "../../InfoBox";
import MUIDataTable from "mui-datatables";
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

let displayColumns = [];
let originalData = [];
let filterData = [];
let sortOrder = {};
let container = "";
let currentPage = 1;
let unformattedData = {};
let selectedRows = {};
let removedColumns = {};
let removedColumnsKey = {};
let pageSize = 500;
const getRemovedColumns = (columns, filterColumns, selectedColumns) => {
    let removedColumns = [];
    columns.forEach((d, index) => {
        if (d.displayOption) {
            if (d.display === false || !filterColumns.length || !filterColumns.find(column => d.column === column)) {
                removedColumns.push(`${index}`);
            }
        } else if (selectedColumns && selectedColumns.length) {
            if (!selectedColumns.find(column => d.label === column)) {
                removedColumns.push(`${index}`)
            }
        } else if (d.display === false) {
            removedColumns.push(`${index}`);
        }
    });
    return removedColumns;
}

const getColumnByContext = (columns, context) => {
    const filterColumns = [];
    let removedColumnsKey = '';
    columns.forEach((d) => {
        if (d.displayOption) {
            for (let key in d.displayOption) {
                if (context.hasOwnProperty(key)) {
                    removedColumnsKey = context[key];
                    const keyValue = d.displayOption[key];
                    const contextKeyValue = context[key];
                    if ((typeof keyValue === 'string' && contextKeyValue === keyValue) ||
                        (Array.isArray(keyValue) && keyValue.includes(contextKeyValue))) {
                        filterColumns.push(d.column);
                    }
                }
            }
        }
    })
    return { filterColumns, removedColumnsKey };
}

const updateTableStatus = (param = {}, updateScroll) => (updateScroll && updateScroll(param));

const isEmptyData = (data) => (isEmpty(data));

const resetFilters = (page = 1, selectedRow = {}) => {
    currentPage = page;
    selectedRows = selectedRow;
}

const getGraphProperties = (props) => {
  const {
      data,
      scrollData,
      size,
  } = props;

  return {
      searchString: objectPath.has(scrollData, 'searchText') ? objectPath.get(scrollData, 'searchText') : null,
      sort: objectPath.has(scrollData, 'sort') ? objectPath.get(scrollData, 'sort') : null,
      size: size || data.length,
      pageSize: objectPath.has(scrollData, 'pageSize') ? objectPath.get(scrollData, 'pageSize') : pageSize,
      currentPage: objectPath.has(scrollData, 'currentPage') ? objectPath.get(scrollData, 'currentPage') : 1,
      expiration: objectPath.has(scrollData, 'expiration') ? objectPath.get(scrollData, 'expiration') : false,
      removedColumns: objectPath.has(scrollData, `removedColumns_${removedColumnsKey}`) ? objectPath.get(scrollData, `removedColumns_${removedColumnsKey}`) : uniq(removedColumns),
  }
}

const Table = (props) => {
    const {
        width,
        height,
        properties,
    } = props;

    const {
        showCheckboxes,
        hidePagination,
        fixedHeader,
        selectColumnOption,
        searchBar,
        limit,
    } = properties;

    let multiSelectable = true;
    pageSize = limit || pageSize;
    let scroll = props.scroll;
    let updateScrollNow = false;

    const [selected, setSelectedState] = useState([]);
    const [data, setData] = useState([]);
    const [fontSize, setFontSize] = useState(style.defaultFontsize);
    const [contextMenu, setContextMenu] = useState(null);
    const [showInfoBox, setShowInfoBox] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [infoBoxRow, setInfoBoxRow] = useState({});
    const [infoBoxColumn, setInfoBoxColumn] = useState({});
    const [infoBoxData, setInfoBoxData] = useState({});
    const [infoBoxScript, setInfoBoxScript] = useState({});

    const initiate = (props) => {
        const {
            scroll,
            scrollData,
            requestId,
        } = props;
        const {
            currentPage,
        } = getGraphProperties(props);

        if (scroll) {
            selectedRows = objectPath.has(scrollData, 'selectedRow') ? objectPath.get(scrollData, 'selectedRow') : {};
            selectedRows = selectedRows[requestId];
            if (!objectPath.has(scrollData, 'pageSize')) {
                updateTableStatus({ pageSize }, props.updateScroll);
            }
        }

        const {
            matchingRowColumn,
        } = properties;

        const columns = getColumns();

        if (!columns.length) {
            return;
        }

        filterData = [];
        unformattedData = {};
        const columnNameList = [];

        columns.forEach(d => {
            columnNameList.push(d.column);
        });

        props.data.forEach((d, i) => {
            const random = Math.floor(new Date().valueOf() * Math.random());
            const data = {
                'row_id': random,
            };

            for (let key in columns) {
                if (columns.hasOwnProperty(key)) {
                    const columnData = { ...columns[key] };
                    delete columnData.totalCharacters;

                    const accessor = columnAccessor(columnData);
                    data[columnData.column] = accessor(d);

                    if (columnData.tooltip && !columnNameList.includes(columnData.tooltip.column)) {
                        data[columnData.tooltip.column] = columnAccessor({ column: columnData.tooltip.column })(d);
                    }

                    if (matchingRowColumn && !columnNameList.includes(matchingRowColumn)) {
                        data[matchingRowColumn] = columnAccessor({ column: matchingRowColumn })(d);
                    }
                }
            }

            filterData.push(data);
            unformattedData[random] = d;
        })
        originalData = filterData;

        resetFilters((currentPage || 1), selectedRows);
        updateData();
    }

    const {
        size,
    } = getGraphProperties(props);

    const isScrollExpired = () => {
        const {
            expiration,
        } = getGraphProperties(props);

        return scroll && expiration && expiration <= Date.now();
    }

    const isScrollDataExists = (page) => {
        const {
            data,
        } = props;

        const {
            pageSize,
        } = getGraphProperties(props);

        let startIndex = (page - 1) * pageSize;
        return startIndex < data.length;
    }

    const decrementFontSize = () => (setFontSize(fontSize - 1));

    const checkFontsize = () => (container && container.querySelector('table').clientWidth > container.clientWidth ? fontSize >= style.defaultFontsize : decrementFontSize());

    const handleSearch = (data, isSuccess, expression = null, searchText = null) => {
        if (isSuccess) {
            if (expression) {
                const {
                    searchString,
                } = getGraphProperties(props);

                const search = labelToField(expandExpression(expression), getColumns());
                filterData = data;

                if (!searchText || searchString !== searchText) {
                    updateTableStatus({ search, searchText, selectedRow: {}, currentPage: 1, event: events.SEARCH }, props.updateScroll);
                }
            } else {
                filterData = data;
                updateData();
                resetFilters();
            }
        }
    }

    const updateData = () => {
        const {
            pageSize,
        } = getGraphProperties(props);

        const offset = pageSize * (currentPage - 1);

        setData(scroll ? filterData.slice(0, offset + pageSize) : filterData);
        setSelectedState(selectedRows[currentPage] || []);
    }

    const getColumns = () => (properties.columns || []);

    const getHeaderData = (initialSort) => {
        const {
            removedColumns,
        } = getGraphProperties(props);

        const columns = getColumns();
        let headerData = [];
        for (let index in columns) {
            if (columns.hasOwnProperty(index)) {
                const columnRow = columns[index];
                const displayColumn = removedColumns.includes(index) ? 'false' : 'true';
                const headerColumn = {
                    name: index,
                    label: columnRow.label || columnRow.column,
                    columnField: columnRow.column,
                    columnText: columnRow.selection ? "" : (columnRow.label || columnRow.column),
                    filter: columnRow.filter !== false,
                    type: columnRow.selection ? "selection" : "text",
                    style: {
                        textIndent: '2px'
                    },
                    options: {
                        display: displayColumn
                    }
                };

                if ((initialSort && initialSort.column === columnRow.column) ||
                    (sortOrder && sortOrder.column === columnRow.column)) {
                    headerColumn.options = {
                        display: displayColumn,
                        sortDirection: isEmptyData(initialSort) ? sortOrder.order : initialSort.order,
                        sort: true,
                    }
                }

                headerData.push(headerColumn);
            }
        }

        return headerData;
    }

    const getTableData = (columns) => {
        const {
            highlight,
            highlightColor,
        } = properties;

        const {
            removedColumns,
        } = getGraphProperties(props);

        if (!columns) {
            return [];
        }

        const keyColumns = getColumns();
        const usedColumns = keyColumns.filter((column, index) => !removedColumns.includes(index.toString()));

        if (usedColumns.length) {
            first(usedColumns).firstColStyle = firstColToolTipStyle;
            last(usedColumns).lastColStyle = lastColToolTipStyle;
        }

        return data.map((d, j) => {
            let data = {},
                highlighter = false;

            for (let key in keyColumns) {
                if (keyColumns.hasOwnProperty(key)) {

                    const columnObj = keyColumns[key],
                        originalData = d[columnObj.column];
                    let columnData = originalData;

                    if (columnObj.totalCharacters) {
                        columnData = columnAccessor({ column: columnObj.column, totalCharacters: columnObj.totalCharacters })(d);
                    }

                    if ((columnData || columnData === 0) && columnObj.tooltip) {
                        let fullText = d[columnObj.tooltip.column] || originalData;
                        fullText = Array.isArray(fullText) ? fullText.join(", ") : fullText;

                        const hoverContent = (
                            <div key={`tooltip_${j}_${key}`}>
                                {fullText} &nbsp;
                                <CopyToClipboard text={fullText ? fullText.toString() : ''}>
                                    <button style={{ background: '#000', padding: 1 }} title="copy">
                                        <FaRegClipboard size={10} color="#fff" />
                                    </button>
                                </CopyToClipboard>
                            </div>
                        )

                        columnData = (
                            <Tooltip key={`tooltip_${j}_${key}`}
                                content={[hoverContent]}
                                styles={columnObj.firstColStyle || columnObj.lastColStyle || toolTipStyle}>
                                {columnData}
                            </Tooltip>
                        )
                    }

                    if (highlight && highlight.includes(columnObj.column) && originalData) {
                        highlighter = true;
                    }

                    if (columnObj.colors && columnObj.colors[originalData]) {
                        columnData = (
                            <div style={{ background: columnObj.colors[originalData] || '', width: "10px", height: "10px", borderRadius: "50%", marginRight: "6px" }}></div>
                        )
                    }

                    if (columnObj.infoBox && columnData) {
                        columnData = (
                            <React.Fragment>
                                {columnData}
                                <span style={{ padding: "0px 5px" }} onClick={(e) => {
                                    e.stopPropagation();
                                    openInfoBox({
                                        infoBoxRow: d,
                                        infoBoxColumn: columnObj.column,
                                        infoBoxData: originalData,
                                        infoBoxScript: columnObj.infoBox
                                    })
                                }}>
                                    <EyeIcon size={fontSize + 2} color="#555555" />
                                </span>
                            </React.Fragment>
                        )
                    }

                    if (columnData || columnData === 0) {
                        data[key] = typeof (columnData) === "boolean" ? columnData.toString().toUpperCase() :
                            (typeof originalData === 'object') ? null : columnData;

                        data[key] = <div className="wrapper-data"> {data[key]} </div>;

                        if (columnObj.fontColor) {
                            data[key] = <div style={{ color: columnObj.fontColor }}> {data[key]} </div>;
                        }
                    }
                }
            }

            if (highlighter) {
                Object.keys(data).map(key => {
                    return data[key] = <div style={{ background: highlightColor || '', height: style.row.height, padding: "10px 0" }}>
                        {data[key]}</div>
                })
            }
            return data;
        })
    }

    const handleColumnViewChange = (changedColumn, action) => {
        const {
            removedColumns: removedColumnsProps,
        } = getGraphProperties(props);

        if (action === 'remove') {
            displayColumns = uniq([...displayColumns, ...removedColumnsProps, changedColumn]);
        } else {
            const removedIndex = removedColumnsProps.indexOf(changedColumn);
            if (removedIndex > -1 && !isEmpty(removedColumnsProps)) {
                removedColumnsProps.splice(removedIndex, 1);
            }
            displayColumns = [...removedColumnsProps];
        }
    }

    const handleRowsPerPageChange = (numberOfRows) => {
        if (scroll) {
            updateTableStatus({
                pageSize: numberOfRows,
                event: events.PAGING,
            }, props.updateScroll);
        }
        pageSize = numberOfRows;
    }

    const handleScrollSorting = (column) => {
        const { sort } = getGraphProperties(props);

        let colOrder = 'asc';
        if (sort && sort.column === column) {
            colOrder = sort.order === 'desc' ? 'asc' : 'desc';
        }

        updateTableStatus({
            sort: { column: column, order: colOrder },
            currentPage: 1,
            selectedRow: {},
            event: events.SORTING,
        }, props.updateScroll)
    }

    const handleStaticSorting = (column) => {
        let colOrder = 'asc';
        if (sortOrder && sortOrder.column === column) {
            colOrder = sortOrder.order === 'desc' ? 'asc' : 'desc';
            sortOrder.order = colOrder;
        } else {
            sortOrder.order = colOrder;
            sortOrder.column = column;
        }

        filterData = orderBy(filterData, [column], [colOrder]);

        resetFilters();
        updateData();
    }

    const handleSortOrderChange = (column, order) => {
        const columnList = getColumns();
        const columnData = columnList[column];

        scroll ? handleScrollSorting(columnData.column) : handleStaticSorting(columnData.column)
    }

    const handlePageClick = (page) => {
        if (page > currentPage - 1) {
            if (isScrollExpired() && !isScrollDataExists(currentPage + 1)) {
                setShowConfirmationPopup(true);
                return;
            }
            ++currentPage;
        } else {
            --currentPage;
        }

        scroll ? updateTableStatus({ currentPage: currentPage, event: events.PAGING }, props.updateScroll) : updateData();
    }

    const handleClick = (key) => {
        if (props.onMarkClick && data[key])
            props.onMarkClick(unformattedData[data[key]['row_id']]);
    }

    const handleRowSelection = (currentSelectedRow, allRows) => {
        let selectedRowsCurr = [];
        allRows.forEach(x => {
            if (!selectedRowsCurr.includes(x.dataIndex)) {
                selectedRowsCurr.push(x.dataIndex);
            }
        });

        const {
            multiSelectable,
            matchingRowColumn,
        } = properties;

        if (!multiSelectable) {
            handleClick(...selectedRowsCurr);
            selectedRows = {};
            // updateScrollNow = true;
        }

        selectedRows[currentPage] = selectedRowsCurr.slice();
        const { onSelect, scrollData } = properties;
        if (onSelect) {
            let matchingRows = [];
            let rows = {};
            const selectedData = getSelectedRows();
            if (selectedData.length > 1) {
                rows = selectedData;
            } else {
                let row = selectedData.length ? selectedData[0] : {};
                if (matchingRowColumn && row) {
                    const value = objectPath.get(row, matchingRowColumn);
                    matchingRows = props.data.filter((d) => {
                        const matchingRowValue = objectPath.get(d, matchingRowColumn);
                        return (value || value === 0) && !isEqual(row, d) && value === matchingRowValue;
                    });
                }
                rows = row;
            }
            onSelect({ rows, matchingRows });
        }
        // const rowsInStore = objectPath.has(scrollData, 'selectedRow') ? objectPath.get(scrollData, 'selectedRow') : {};

        // if (updateScrollNow) {
        //     updateTableStatus({ selectedRow: { ...rowsInStore, [props.requestId]: selectedRows } }, props.updateScroll)
        // }
        // updateScrollNow = true;

    }

    const getMenu = () => {
        const {
            menu,
            multiMenu,
        } = properties;

        if (multiMenu && getSelectedRows().length > 1) {
            return multiMenu;
        }

        return menu || false;
    }

    const handleContextMenu = (event) => {
        const menu = getMenu();

        if (!menu) {
            return false;
        }
        event.preventDefault();
        const { clientX: x, clientY: y } = event;
        setContextMenu({ x, y });
        return true;
    }

    const handleCloseContextMenu = () => {
        setContextMenu({ contextMenu: null });
        closeContextMenu();
    }

    const closeContextMenu = () => {
        document.body.removeEventListener('click', handleCloseContextMenu);
        const node = document.getElementById('contextMenu');
        if (node) {
            node.remove();
        }
    }

    const openContextMenu = () => {
        const { x, y } = contextMenu;
        const menu = getMenu();

        closeContextMenu();
        document.body.addEventListener('click', handleCloseContextMenu);

        const node = document.createElement('ul');
        node.classList.add('contextMenu');
        node.id = 'contextMenu';
        node.style = `top: ${y}px; left: ${x}px; z-index: 100000;`;

        const { goTo, context, id } = properties;
        context.id = id;

        menu.forEach((item) => {
            const { text, rootpath, params } = item;
            const pathname = `${process.env.PUBLIC_URL}/${rootpath}`;
            const li = document.createElement('li');
            li.textContent = text;
            const queryParams = (params && Object.getOwnPropertyNames(params).length > 0) ?
                Object.assign({}, context, params) : Object.assign({}, context);
            li.onclick = (e) => {
                goTo && goTo(pathname, queryParams);
            };
            node.append(li);
        });
        document.body.append(node);
    }

    const getSelectedRows = () => {
        const {
            pageSize,
        } = getGraphProperties(props);

        let selected = [];
        for (let page in selectedRows) {
            if (selectedRows.hasOwnProperty(page)) {
                selectedRows[page].forEach((index) => {
                    selected.push(props.data[(page - 1) * pageSize + index]);
                })
            }
        }
        return selected;
    }

    const renderSearchBarIfNeeded = (headerData) => {
        const {
            searchString,
        } = getGraphProperties(props);
        const {
            searchBar,
            searchText,
            autoSearch,
            disableRefresh,
            selectColumnOption,
        } = properties;

        const {
            width,
        } = props;

        if (searchBar === false)
            return;

        const search = searchString !== null ? searchString : searchText,
            filteroption = headerData.filter(d => d.options.display === 'true');
        return ((filteroption.length || (originalData.length === 0)) &&
            <SearchBar
                data={originalData}
                searchText={search}
                options={filteroption}
                handleSearch={handleSearch}
                scroll={props.scroll}
                autoSearch={autoSearch}
                enableRefresh={!disableRefresh && scroll}
                columnOption={selectColumnOption}
                cardWidth={width}
            />
        );
    }

    const removeHighlighter = (data = []) => {
        const {
            highlight,
        } = properties;

        if (!data.length)
            return data;

        if (highlight) {
            selected.forEach((key) => {
                if (highlight && data[key]) {
                    for (let i in data[key]) {
                        if (data[key].hasOwnProperty(i)) {
                            if (data[key][i].props.style)
                                data[key][i].props.style.background = '';
                        }
                    }
                }
            })
        }
        return data;
    }

    const resetScrollData = () => {
        const { disableRefresh } = properties;

        return (
            scroll && !disableRefresh ?
                <div style={{ flex: "none" }}>
                    <IconButton
                        tooltip="Refresh"
                        tooltipPosition={'top-left'}
                        style={style.button.design}
                        onClick={() => updateTableStatus({ currentPage: 1, selectedRow: {}, event: events.REFRESH }, props.updateScroll)}
                    >
                        <RefreshIcon className='refreshIcon' />
                    </IconButton>
                </div>
                : ''
        )
    }

    const openInfoBox = ({
        infoBoxRow,
        infoBoxColumn,
        infoBoxData,
        infoBoxScript,
    }) => {
        setShowInfoBox(true);
        setInfoBoxRow(infoBoxRow);
        setInfoBoxColumn(infoBoxColumn);
        setInfoBoxData(infoBoxData);
        setInfoBoxScript(infoBoxScript);
    }

    const onInfoBoxCloseHandler = () => setShowInfoBox(false);

    const renderInfoBox = () => {
        const {
            Script,
        } = props;

        return (
            showInfoBox &&
            <InfoBox
                onInfoBoxClose={onInfoBoxCloseHandler}
            >
                <Script
                    row={infoBoxRow}
                    key={infoBoxColumn}
                    value={infoBoxData}
                    script={infoBoxScript}
                />
            </InfoBox>
        )
    }

    const renderConfirmationDialog = () => {
        const actions = [
            <FlatButton
                label="Stay on Current Page"
                labelStyle={style.button.labelStyle}
                primary={true}
                onClick={() => setShowConfirmationPopup(false)}
            />,
            <FlatButton
                label="Continue"
                labelStyle={style.button.labelStyle}
                primary={true}
                onClick={() => updateTableStatus({ currentPage: 1, selectedRow: {}, event: events.REFRESH }, props.updateScroll)}
            />,
        ];

        return (
            showConfirmationPopup &&
            <React.Fragment>
                <Dialog
                    title="Unable to fetch"
                    actions={actions}
                    modal={true}
                    contentClassName='dialogBody'
                    open={true}
                >
                    Due to inactivity, we are not able to process the next page. Please press "Continue", to reload the data from first page.
                </Dialog>
            </React.Fragment>
        );
    }

    const getHeightMargin = (showFooter) => {
        const {
            searchBar,
            selectColumnOption,
            filterOptions,
        } = properties;

        let heightMargin = showFooter ? 40 : 0;
        heightMargin = searchBar === false ? heightMargin : heightMargin + 50;
        heightMargin = filterOptions ? heightMargin : heightMargin + 10;
        heightMargin = selectColumnOption ? heightMargin + 20 : heightMargin;

        return heightMargin;
    }

    const getInitialSort = () => {
        const {
            sort,
        } = getGraphProperties(props);

        let initialSort = {};
        if (sort && sort.column && sort.order) {
            initialSort = { ...sort, column: sort.column }
        }

        return initialSort;
    }

    useEffect(() => {
        initiate(props);
        checkFontsize();
        if (contextMenu) {
            openContextMenu();
        }
        return () => {
            const columnsCurr = props.data.columns || [];
            const { filterColumns, removedColumnsKey: removedColumnsKeyCurr } = getColumnByContext(columnsCurr, props.context);
            const removedColumnsCurr = getRemovedColumns(columnsCurr, filterColumns, props.selectedColumns);

            if (removedColumnsKeyCurr !== removedColumnsKey || !isEqual(removedColumnsCurr, removedColumns)) {
                removedColumns = removedColumnsCurr;
                removedColumnsKey = removedColumnsKeyCurr;
            }

            const {
                scrollData,
            } = props;

            let removedColumns = objectPath.has(scrollData, `removedColumns_${removedColumnsKey}`) ? objectPath.get(scrollData, `removedColumns_${removedColumnsKey}`) : uniq(removedColumns);

            if (!isEmpty(displayColumns) && !isEqual(removedColumns, displayColumns)) {
                updateTableStatus({
                    [`removedColumns_${removedColumnsKey}`]: displayColumns,
                    event: events.REMOVED_COLUMNS
                }, props.updateScroll);
            }

            const rowsInStore = objectPath.has(scrollData, 'selectedRow') ? objectPath.get(scrollData, 'selectedRow') : {}

            if (!objectPath.has(scrollData, 'selectedRow') && !isEmpty(selectedRows)) {
                updateTableStatus({ selectedRow: { ...rowsInStore, [props.requestId]: selectedRows } }, props.updateScroll)
            }
        }
    }, [props.data, props.width, props.height, props.context]);

    let tableData = getTableData(getColumns());
    tableData = removeHighlighter(tableData);
    const tableCurrentPage = currentPage - 1;
    const initialSort = getInitialSort();
    const headerData = getHeaderData(initialSort);
    const totalRecords = scroll ? size : filterData.length;
    const rowsPerPageSizes = uniq([10, 15, 20, 100, pageSize]);
    const rowsPerPageOptions = rowsPerPageSizes.filter(rowsPerPageSize => rowsPerPageSize < totalRecords);
    const showFooter = (totalRecords <= pageSize && hidePagination !== false && scroll !== true) ? false : true;
    const heightMargin = getHeightMargin(showFooter);
    const options = {
        print: false,
        filter: false,
        download: false,
        search: false,
        sort: true,
        viewColumns: selectColumnOption || false,
        responsive: "scroll",
        fixedHeader: fixedHeader,
        pagination: showFooter,
        rowsPerPage: pageSize,
        count: totalRecords,
        page: tableCurrentPage,
        rowsPerPageOptions: rowsPerPageOptions,
        selectableRows: multiSelectable ? 'multiple' : 'single',
        onChangePage: handlePageClick,
        rowsSelected: selected,
        onRowsSelect: handleRowSelection,
        selectableRowsOnClick: true,
        onColumnSortChange: handleSortOrderChange,
        onChangeRowsPerPage: handleRowsPerPageChange,
        onColumnViewChange: handleColumnViewChange,
        disableToolbarSelect: true,
        textLabels: {
            body: {
                noMatch: "No data to visualize",
                toolTip: "Sort",
            },
            pagination: {
                next: "Next Page",
                previous: "Previous Page",
                rowsPerPage: "Rows per page:",
                displayRows: "of",
            },
            toolbar: {
                viewColumns: "Select Column",
            },
            viewColumns: {
                title: "Select Column",
                titleAria: "Show/Hide Table Columns",
            },
            selectedRows: {
                text: "row(s) selected",
                delete: "Delete",
                deleteAria: "Delete Selected Rows",
            },
        },
    };
    const muiTableStyle = {
        MUIDataTableSelectCell: {
            root: {
                display: showCheckboxes ? '' : 'none',
            },
        },
        MUIDataTableBody: {
            emptyTitle: {
                maxWidth: width,
            },
        },
        MUIDataTable: {
            responsiveScroll: {
                height: (height - heightMargin),
            },
        },
        MUIDataTableToolbar: {
            actions: {
                marginTop: searchBar || searchBar === undefined ? '-90px' : '0px',
                marginRight: searchBar || searchBar === undefined ? '-10px' : '0px',
            }
        },
        MuiPaper: {
            elevation4: {
                boxShadow: (searchBar || searchBar === undefined ? '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)' : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 0px 0px 0px rgba(0,0,0,0.12)'),
            }
        },
        MUIDataTableToolbarSelect: {
            root: {
                display: "none",
            },
        },
        MuiTableCell: {
            root: {
                padding: "10px 40px 10px 15px",
                fontSize: "10px",
            },
        }
    }
    const theme = createMuiTheme({
        overrides: { ...style.muiStyling, ...muiTableStyle }
    });

    return (
        <MuiThemeProvider theme={theme}>
            <div ref={(input) => { container = input; }}
                onContextMenu={handleContextMenu}
            >
                {resetScrollData()}

                {renderConfirmationDialog()}
                {renderInfoBox()}

                <div style={{ clear: "both" }}></div>
                {renderSearchBarIfNeeded(headerData)}

                <MUIDataTable
                    data={tableData}
                    columns={headerData}
                    options={options}
                />
            </div>
        </MuiThemeProvider>
    );
}

Table.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
    WithValidationHOC(),
    (WithConfigHOC(properties))
)(Table);