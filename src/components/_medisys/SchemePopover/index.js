import React, { useState, useEffect } from 'react'
import Refresh from '@material-ui/icons/Sync'
import More from '@material-ui/icons/MoreHoriz'
import moment from 'moment'
import CHASCardReplacement from './CHASCardReplacement'
import {
  CommonModal,
  GridContainer,
  GridItem,
  Button,
  Popover,
  CodeSelect,
  IconButton,
  DatePicker,
  dateFormatLong,
  NumberInput,
} from '@/components'
import { MoreButton } from '@/components/_medisys'

const SchemePopover = ({
  isBanner = false,
  isShowReplacementModal = false,
  schemeData,
  entity,
  handleRefreshChasBalance,
}) => {
  const [
    showReplacementModal,
    setShowReplacementModal,
  ] = useState(isShowReplacementModal)

  const {
    isSuccessful,
    schemeTypeFK,
    validFrom,
    validTo,
    balance,
    acuteBalanceStatusCode,
    acuteVisitPatientBalance,
    acuteVisitClinicBalance,
    chronicBalanceStatusCode,
    statusDescription,
  } = schemeData

  const handleReplacementModalVisibility = (show = false) => {
    setShowReplacementModal(show)
  }

  useEffect(
    () => {
      if (isShowReplacementModal) {
        handleReplacementModalVisibility(true)
      }
    },
    [
      isShowReplacementModal,
    ],
  )

  return (
    <React.Fragment>
      <Popover
        icon={null}
        content={
          <div>
            <GridContainer>
              <GridItem>
                <div
                  style={{
                    fontWeight: 500,
                    marginBottom: 0,
                    paddingLeft: 0,
                  }}
                >
                  <CodeSelect text code='ctSchemeType' value={schemeTypeFK} />

                  {/* <div
                    style={{
                      display: 'inline-block',
                      position: 'absolute',
                      float: 'right',
                    }}
                  >
                    <IconButton onClick={handleRefreshChasBalance}>
                      <Refresh fontSize='large' />
                    </IconButton>
                  </div> */}
                </div>
              </GridItem>
              <GridItem>
                <IconButton onClick={handleRefreshChasBalance}>
                  <Refresh fontSize='large' />
                </IconButton>
              </GridItem>
            </GridContainer>
            <GridContainer>
              <GridItem>
                <p>
                  Validity:{' '}
                  <DatePicker text format={dateFormatLong} value={validFrom} />
                  -
                  <DatePicker text format={dateFormatLong} value={validTo} />
                </p>
              </GridItem>
            </GridContainer>
            <GridContainer>
              {chronicBalanceStatusCode === 'SC105' ? (
                <GridItem> Balance: Full Balance</GridItem>
              ) : (
                <GridItem>
                  {' '}
                  Balance: <NumberInput text currency value={balance} />
                </GridItem>
              )}
            </GridContainer>
            <GridContainer>
              {acuteBalanceStatusCode === 'SC100' ||
              (acuteVisitPatientBalance !== undefined &&
                acuteBalanceStatusCode === undefined) ? (
                <GridItem>
                  Patient Acute Visit Balance:{' '}
                  <div
                    style={{
                      fontWeight: 500,
                      display: 'inline-block',
                      paddingLeft: 2,
                    }}
                  >
                    {acuteVisitPatientBalance} Remaining{' '}
                  </div>{' '}
                  for Year {moment().year()}
                </GridItem>
              ) : (
                <GridItem>Patient Acute Visit Balance: NA</GridItem>
              )}
            </GridContainer>
            <GridContainer>
              {acuteBalanceStatusCode === 'SC100' ||
              (acuteVisitClinicBalance !== undefined &&
                acuteBalanceStatusCode === undefined) ? (
                <GridItem>
                  Patient Acute Clinic Balance:
                  <div
                    style={{
                      fontWeight: 500,
                      display: 'inline-block',
                      paddingLeft: 2,
                    }}
                  >
                    {acuteVisitClinicBalance} Remaining
                  </div>{' '}
                  for {moment().format('MMMM')} {moment().year()}
                </GridItem>
              ) : (
                <GridItem> Patient Acute Clinic Balance: NA</GridItem>
              )}
            </GridContainer>

            <GridContainer>
              <GridItem>
                <p style={{ color: 'red' }}>{statusDescription}</p>
              </GridItem>
            </GridContainer>
          </div>
        }
        trigger='click'
        placement='bottomLeft'
      >
        <div
          style={{
            display: 'inline-block',
            right: 10,
            position: isBanner ? '' : 'absolute',
          }}
        >
          {isBanner ? (
            <MoreButton />
          ) : (
            <IconButton>
              <More />
            </IconButton>
          )}
        </div>
        {/* <div
          style={{
            display: 'inline-block',
            right: 10,
            position: isBanner ? '' : 'absolute',
          }}
        >
          {isBanner ? (
            <Button simple variant='outlined' color='info' size='sm'>
              More
            </Button>
          ) : (
            <IconButton>
              <More />
            </IconButton>
          )}
        </div> */}
      </Popover>
      <CommonModal
        open={showReplacementModal}
        title='CHAS Card Replacement'
        maxWidth='sm'
        onConfirm={() => handleReplacementModalVisibility(false)}
        onClose={() => handleReplacementModalVisibility(false)}
      >
        <CHASCardReplacement
          entity={entity}
          refreshedSchemeData={schemeData}
          handleOnClose={() => handleReplacementModalVisibility(false)}
        />
      </CommonModal>
    </React.Fragment>
  )
}

export default SchemePopover
