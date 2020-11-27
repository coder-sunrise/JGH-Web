import React from 'react'
// formik
import { FastField, withFormik } from 'formik'
// common components
import {
  ProgressButton,
  GridContainer,
  GridItem,
  TextField,
  RadioGroup,
} from '@/components'
import Search from '@material-ui/icons/Search'

const Filterbar = ({ handleSubmit, showType, setShowType }) => {
  return (
    <GridContainer alignItems='center'>
      <GridItem md={4}>
        <FastField
          name='search'
          render={(args) => <TextField {...args} label='Title, Canned Text' />}
        />
      </GridItem>
      <GridItem md={8}>
        <div>
          <div style={{ display: 'inline-Block' }}>
            <ProgressButton
              color='primary'
              size='sm'
              icon={<Search />}
              onClick={handleSubmit}
            >
              Search
            </ProgressButton>
          </div>
          <div style={{ display: 'inline-Block', marginLeft: 10 }}>
            <RadioGroup
              label=''
              simple
              options={[
                {
                  value: 'Self',
                  label: 'My Canned Text',
                },
                {
                  value: 'Shared',
                  label: 'Shared From Others',
                },
              ]}
              value={showType}
              onChange={(v) => {
                setShowType(v.target.value)
              }}
            />
          </div>
        </div>
      </GridItem>
    </GridContainer>
  )
}

export default withFormik({
  handleSubmit: (values, { props }) => {
    const { onSearchClick } = props
    onSearchClick(values)
  },
})(Filterbar)
