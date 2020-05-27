import React, { PureComponent } from 'react'
import Edit from '@material-ui/icons/Edit'
import { CommonTableGrid, Button, Tooltip } from '@/components'
import { status } from '@/utils/codes'

class Grid extends PureComponent {
    editRow = (row, e) => {
        if (row.isUserMaintainable) {
            const { dispatch, settingRefractionTestType } = this.props

            const { list } = settingRefractionTestType
            dispatch({
                type: 'settingRefractionTestType/updateState',
                payload: {
                    showModal: true,
                    entity: list.find((o) => o.id === row.id),
                },
            })
        }
    }

    render() {
        return (
            <CommonTableGrid
                style={{ margin: 0 }}
                type='settingRefractionTestType'
                onRowDoubleClick={this.editRow}
                columns={[
                    { name: 'code', title: 'Code' },
                    { name: 'displayValue', title: 'Display Value' },
                    { name: 'description', title: 'Description' },
                    { name: 'isActive', title: 'Status' },
                    {
                        name: 'action',
                        title: 'Action',
                    },
                ]}
                // FuncProps={{ pager: false }}
                columnExtensions={[
                    {
                        columnName: 'isActive',
                        sortingEnabled: false,
                        type: 'select',
                        options: status,
                        align: 'center',
                        width: 100,
                    },
                    {
                        columnName: 'action',
                        sortingEnabled: false,
                        align: 'center',
                        render: (row) => {
                            return (
                                <Tooltip title='Edit Case Type'>
                                    <Button
                                        size='sm'
                                        onClick={() => {
                                            this.editRow(row)
                                        }}
                                        justIcon
                                        color='primary'
                                        disabled={!row.isUserMaintainable}
                                    >
                                        <Edit />
                                    </Button>
                                </Tooltip>
                            )
                        },
                    },
                ]}
            />
        )
    }
}

export default Grid
