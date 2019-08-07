import React from 'react'
import $ from 'jquery'
import Delete from '@material-ui/icons/Delete'
import Save from '@material-ui/icons/Save'
import Edit from '@material-ui/icons/Edit'
import Cancel from '@material-ui/icons/Clear'

import { Button } from '@/components'
import { updateGlobalVariable, getGlobalVariable } from '@/utils/utils'

let commitCount = 0
const EditButton = ({ onExecute, editingRowIds }) => (
  <Button
    size='sm'
    onClick={(e) => {
      if (editingRowIds.length === 0) {
        window.g_app._store.dispatch({
          type: 'global/updateState',
          payload: {
            disableSave: true,
          },
        })
      }
      onExecute(e)
    }}
    justIcon
    color='primary'
    title='Edit'
  >
    <Edit />
  </Button>
)

const CancelButton = ({ onExecute, row, editingRowIds }) => (
  <Button
    size='sm'
    onClick={(e) => {
      // updateGlobalVariable('gridIgnoreValidation', true)
      if (
        (!row.id && editingRowIds.length === 0) ||
        (row.id && editingRowIds.length === 1)
      ) {
        window.g_app._store.dispatch({
          type: 'global/updateState',
          payload: {
            disableSave: false,
          },
        })
      }
      onExecute(e)
    }}
    justIcon
    color='danger'
    title='Cancel'
  >
    <Cancel />
  </Button>
)

const DeleteButton = ({ onExecute }) => (
  <Button
    size='sm'
    onClick={(e) => {
      // updateGlobalVariable('gridIgnoreValidation', true)
      onExecute(e)
    }}
    justIcon
    color='primary'
    title='Delete'
  >
    <Delete />
  </Button>
)

const AddButton = ({ onExecute }) => (
  <div style={{ textAlign: 'center' }}>
    <Button
      color='primary'
      onClick={(e) => {
        // updateGlobalVariable('gridIgnoreValidation', false)
        onExecute(e)
      }}
      title='Create new row'
      className='medisys-table-add'
      style={{ display: 'none' }}
    >
      New
    </Button>
  </div>
)
class CommitButton extends React.PureComponent {
  constructor (props) {
    super(props)
    this.myRef = React.createRef()
  }

  render () {
    const { onExecute, editingRowIds, row, schema, gridId } = this.props

    return (
      <div ref={this.myRef} style={{ display: 'inline-block' }}>
        <Button
          size='sm'
          onClick={(e) => {
            // console.log(
            //   (!row.id && editingRowIds.length === 0) ||
            //     (row.id && editingRowIds.length === 1),
            // )
            if (schema) {
              try {
                schema.validateSync(
                  window.$tempGridRow[gridId]
                    ? window.$tempGridRow[gridId][row.id]
                    : row,
                  {
                    abortEarly: false,
                  },
                )
                // console.log({ r })

                // row._$error = false
              } catch (er) {
                // console.log(er)
                // $(element).parents('tr').find('.grid-commit').attr('disabled', true)
                // console.log(er, this.myRef.current)
                $(this.myRef.current).find('button').attr('disabled', true)
                // const actualError = er.inner.find((o) => o.path === columnName)
                // return actualError ? actualError.message : ''
                // row._$error = true
                window.g_app._store.dispatch({
                  type: 'global/updateState',
                  payload: {
                    commitCount: commitCount++,
                  },
                })
                return false
              }
            }

            if (
              (!row.id && editingRowIds.length === 0) ||
              (row.id && editingRowIds.length === 1)
            ) {
              window.g_app._store.dispatch({
                type: 'global/updateState',
                payload: {
                  disableSave: false,
                },
              })
            }
            // updateGlobalVariable('gridIgnoreValidation', false)
            onExecute(e)
          }}
          justIcon
          data-button-type='progress'
          data-grid-button='true'
          color='primary'
          title='Save'
          className='grid-commit'
        >
          <Save />
        </Button>
      </div>
    )
  }
}

const commandComponents = {
  add: AddButton,
  edit: EditButton,
  delete: DeleteButton,
  commit: CommitButton,
  cancel: CancelButton,
}

const CommandComponent = ({ id, onExecute, ...resetProps }) => {
  const CommandButton = commandComponents[id]
  return <CommandButton onExecute={onExecute} {...resetProps} />
}

export default CommandComponent
