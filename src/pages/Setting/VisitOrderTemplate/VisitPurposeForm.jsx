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
} from '@/components'
import { withStyles } from '@material-ui/core'

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
  console.log(props)
  let {
    footer,
    classes,
    dispatch,
    toggleModal,
    settingVisitOrderTemplate,
  } = props
  let [state, setState] = useState({
    visitPurposeOptions: [1, 2, 3, 4, 5, 6],
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

  let handleClickAddNew = () => {
    const { selectedOption, visitPurposeOptions } = state
    let currentEntity = visitPurposeOptions.find(
      item => item.id == selectedOption,
    )

    // settingVisitOrderTemplate.entity.code = null
    // settingVisitOrderTemplate.entity.displayValue = null

    dispatch({
      type: 'settingVisitOrderTemplate/generateExistingFormEntity',
      payload: {
        isExist: true,
        id: selectedOption,
      },
    })

    // console.log(settingVisitOrderTemplate)
    // dispatch({
    //   type: 'settingVisitOrderTemplate/queryOne',
    //   payload: {
    //     id: selectedOption,
    //   },
    // }).then(r => {
    //   console.log(r);

    // })
    toggleModal()

    // dispatch({
    //   type: 'settingVisitOrderTemplate/queryOne',
    //   payload: {
    //     id: selectedOption,
    //   },
    // }).then(v => {
    //   console.log(v)
    //   if (v) {
    //     dispatch({
    //       type: 'settingVisitOrderTemplate/queryOneDone',
    //       payload: {
    //         data: v,
    //         isExist: true,
    //       },
    //     })
    //     toggleModal()
    //   }
    // })

    // dispatch({
    //   type: 'settingVisitOrderTemplate/updateState',
    //   payload: {
    //     entity: currentEntity,
    //   },
    // })
    // toggleModal()

    if (selectedOption) {
      //   this.props.history.push(`/setting/userrole/new`, { id: selectedOption })
    }
  }
  let onSelect = id => {
    console.log(id)
    setState({ ...state, selectedOption: id })
  }
  return (
    <div>
      <div>
        <GridContainer>
          <GridItem md={4} />
          <GridItem md={4} className={classes.VisitPurposeSelect}>
            <Select
              label='Existing Visit Purpose'
              labelField='displayValue'
              valueField='id'
              options={state.visitPurposeOptions}
              onChange={onSelect}
            />
          </GridItem>
          <GridItem md={4} />
        </GridContainer>
        {footer &&
          footer({
            confirmBtnText: 'Add New',
            onConfirm: handleClickAddNew,
            // confirmProps: {
            //   disabled: !selectedValue,
            // },
          })}
      </div>
    </div>
  )
}

export default withStyles(styles)(VisitPurposeForm)