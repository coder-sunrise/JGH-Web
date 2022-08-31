import React, { useState, useEffect } from 'react'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Button,
  TextField,
  Select,
  CodeSelect,
  ProgressButton,
  LocalSearchSelect,
  Popper,
  CommonModal,
  Tooltip,
} from '@/components'
import { withFormik } from 'formik'
import { withStyles } from '@material-ui/core'
import VisitPurposeDropdownOption from '@/components/Select/optionRender/visitPurpose'

const styles = theme => ({
  VisitPurposeSelect: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(5),
    '& > h4': {
      fontWeight: 500,
    },
  },
})
function VisitPurposeForm(props) {
  let {
    footer,
    classes,
    dispatch,
    toggleModal,
    settingVisitOrderTemplate,
    showFromExistModalFun,
  } = props
  let [state, setState] = useState({
    visitPurposeOptions: [],
    selectedOption: null,
  })
  useEffect(() => {
    dispatch({
      type: 'settingVisitOrderTemplate/queryAll',
      payload: {
        // isActive: undefined,
      },
    }).then(r => {
      console.log(r)
      setState({
        ...state,
        visitPurposeOptions: r.data.data.map(item => {
          return { ...item, isActive: true }
        }),
      })
    })
  }, [])

  let handleClickAddNew = async () => {
    const { selectedOption, visitPurposeOptions } = state
    let currentEntity = visitPurposeOptions.find(
      item => item.id == selectedOption,
    )
    await dispatch({
      type: 'settingVisitOrderTemplate/generateExistingFormEntity',
      payload: {
        isFromExisting: true,
        id: selectedOption,
      },
    })
    showFromExistModalFun(), toggleModal()
  }
  let onSelect = id => {
    setState({ ...state, selectedOption: id })
  }
  return (
    <div>
      <div>
        <GridContainer>
          <GridItem md={2} />
          <GridItem md={8} className={classes.VisitPurposeSelect}>
            <Select
              autoFocus
              label='Existing Visit Purpose'
              labelField='displayValue'
              valueField='id'
              value={state.selectedOption}
              options={state.visitPurposeOptions}
              onChange={onSelect}
              getPopupContainer={() =>
                document.getElementsByClassName(
                  'MuiDialog-container MuiDialog-scrollPaper',
                )[0]
              }
              renderDropdown={option => (
                <VisitPurposeDropdownOption
                  option={option}
                  labelField='displayValue'
                />
              )}
            />
          </GridItem>
          <GridItem md={2} />
        </GridContainer>
        {footer &&
          footer({
            confirmBtnText: 'Add New',
            onConfirm: handleClickAddNew,
            confirmProps: {
              disabled: !state.selectedOption,
            },
          })}
      </div>
    </div>
  )
}
export default withStyles(styles)(VisitPurposeForm)