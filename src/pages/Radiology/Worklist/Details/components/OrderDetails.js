import React, { useEffect, useState, useContext } from 'react'
import { Radio, Typography } from 'antd'
import { useSelector } from 'dva'
import moment from 'moment'
import { useVisitTypes } from '@/utils/hooks/'
import {
  GridContainer,
  GridItem,
  dateFormatLongWithTimeNoSec,
  Icon,
} from '@/components'
import {
  RightAlignGridItem,
  SectionTitle,
  TextGridItem,
} from '../../../Components'
import { CombineOrderGrid } from './index'
import { RADIOLOGY_WORKITEM_STATUS } from '@/utils/constants'
import WorklistContext from '@/pages/Radiology/Worklist/WorklistContext'
import { get } from 'immutable'
import { Popconfirm } from '@medisys/component'
import VisitGroupIcon from '@/pages/Radiology/Components/VisitGroupIcon'

const blueColor = '#1890f8'

const PrimaryAccessionNoHeader = ({ accessionNo }) => (
  <div
    style={{
      display: 'flex',
      marginTop: 18,
      marginBottom: 10,
      marginLeft: 15,
    }}
  >
    {'Combined Accession No.: '}
    <Typography.Text strong>{accessionNo}</Typography.Text>
    <Icon
      type='link'
      style={{
        fontSize: 18,
        color: blueColor,
        alignSelf: 'start',
      }}
    />{' '}
  </div>
)

export const OrderDetails = ({ workitem, onCombinedOrderChange }) => {
  const { isReadOnly, getPrimaryWorkitem } = useContext(WorklistContext)
  const clinicSettings = useSelector(s => s.clinicSettings)
  const visitTypes = useVisitTypes()
  const [isCombinedOrder, setIsCombinedOrder] = useState(false)
  const [isCombinedRadioYes, setIsCombinedRadioYes] = useState(false)
  const [primaryAccessionNo, setPrimaryAccessionNo] = useState('')
  const { isQueueNoDecimal } = clinicSettings.settings || {}

  useEffect(() => {
    if (workitem.primaryWorkitemFK) {
      setIsCombinedOrder(true)
      setPrimaryAccessionNo(getPrimaryAccessionNo(workitem))
    }

    return () => {
      setIsCombinedOrder(false)
      setPrimaryAccessionNo('')
    }
  }, [workitem])

  const getPrimaryAccessionNo = value => {
    const primaryWorkitem = getPrimaryWorkitem(value)
    return primaryWorkitem ? primaryWorkitem.accessionNo : ''
  }

  return (
    <div>
      <SectionTitle title='Order Details' />

      <GridContainer>
        <GridItem md={4}>
          <GridContainer style={{ rowGap: 10 }}>
            <RightAlignGridItem>Accession No. :</RightAlignGridItem>
            <TextGridItem md={6}>{workitem.accessionNo}</TextGridItem>

            <RightAlignGridItem>Examination :</RightAlignGridItem>
            <TextGridItem md={6}>{workitem.itemDescription}</TextGridItem>

            <RightAlignGridItem>Priority :</RightAlignGridItem>
            <TextGridItem md={6}>{workitem.priority}</TextGridItem>

            <RightAlignGridItem>Doctor Instructions :</RightAlignGridItem>
            <TextGridItem md={6}>{workitem.instruction}</TextGridItem>
            <RightAlignGridItem>Remarks :</RightAlignGridItem>
            <TextGridItem md={6}>{workitem.remark}</TextGridItem>
          </GridContainer>
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <GridContainer>
            <RightAlignGridItem>Order Created Time :</RightAlignGridItem>
            <TextGridItem md={6}>
              {moment(workitem.generateDate).format(
                dateFormatLongWithTimeNoSec,
              )}
            </TextGridItem>

            <RightAlignGridItem>Modality :</RightAlignGridItem>
            <TextGridItem md={6}>{workitem.modalityDescription}</TextGridItem>

            <RightAlignGridItem>Visit Type :</RightAlignGridItem>
            <TextGridItem md={6}>
              {visitTypes &&
                visitTypes.length > 0 &&
                workitem?.visitInfo &&
                visitTypes.find(p => p.id === workitem.visitInfo.visitPurposeFK)
                  .name}
            </TextGridItem>

            <RightAlignGridItem>Visit Group No. :</RightAlignGridItem>
            <GridItem md={6}>
              {workitem.visitInfo.visitGroup ? (
                <VisitGroupIcon
                  visitGroup={workitem.visitInfo.visitGroup}
                  visitFK={workitem.visitFK}
                  isQueueNoDecimal={isQueueNoDecimal}
                />
              ) : (
                '-'
              )}
            </GridItem>

            <RightAlignGridItem>Order Combined :</RightAlignGridItem>

            <GridItem md={6}>
              {!isReadOnly &&
                workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW &&
                (workitem.visitWorkitems.length > 1 ? (
                  <Radio.Group
                    onChange={e => {
                      if (e.target.value) {
                        setIsCombinedRadioYes(true)
                      } else {
                        if (!isCombinedOrder) setIsCombinedRadioYes(false)
                      }
                    }}
                    value={isCombinedOrder || isCombinedRadioYes}
                  >
                    <Popconfirm
                      okText='Confirm'
                      cancelText='Cancel'
                      title='Confirm to remove combined order?'
                      disabled={!isCombinedOrder}
                      onConfirm={() => {
                        const currentCombinedOrders = workitem.visitWorkitems.filter(
                          v =>
                            v.primaryWorkitemFK === workitem.primaryWorkitemFK,
                        )
                        setIsCombinedRadioYes(false)
                        onCombinedOrderChange(
                          workitem.visitWorkitems.map(v => {
                            if (
                              v.primaryWorkitemFK === workitem.primaryWorkitemFK
                            )
                              return {
                                ...v,
                                primaryWorkitemFK: null,
                              }
                            return v
                          }),
                        )
                      }}
                    >
                      <Radio value={false}>No</Radio>
                    </Popconfirm>
                    <Radio value={true}>Yes</Radio>
                  </Radio.Group>
                ) : (
                  '-'
                ))}
              {(workitem.statusFK !== RADIOLOGY_WORKITEM_STATUS.NEW ||
                isReadOnly) && (
                <span className='baseOnCustomStyle'>
                  {isCombinedOrder ? 'Yes' : 'No'}
                </span>
              )}
            </GridItem>
          </GridContainer>
        </GridItem>
        {(isCombinedOrder || isCombinedRadioYes) && (
          <React.Fragment>
            <GridItem md={12}>
              <div style={{ display: 'flex' }}>
                <SectionTitle title='Order Combined Details' />
                {primaryAccessionNo !== '' && (
                  <PrimaryAccessionNoHeader accessionNo={primaryAccessionNo} />
                )}
              </div>
            </GridItem>
            <GridItem md={12}>
              <CombineOrderGrid
                visitWorkitems={workitem.visitWorkitems}
                currentWorkitemid={workitem.radiologyWorkitemId}
                onChange={value => {
                  onCombinedOrderChange(value)
                }}
                readonly={workitem.statusFK !== RADIOLOGY_WORKITEM_STATUS.NEW}
              />
            </GridItem>
          </React.Fragment>
        )}
      </GridContainer>
    </div>
  )
}
