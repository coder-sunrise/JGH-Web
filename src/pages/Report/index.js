import React from 'react'
import classnames from 'classnames'
import _ from 'lodash'
// material ui
import { withStyles } from '@material-ui/core'
import Search from '@material-ui/icons/Search'
// common components
import {
  Accordion,
  Button,
  CardContainer,
  GridContainer,
  GridItem,
  TextField,
} from '@/components'
import Authorized from '@/utils/Authorized'
import { menuData } from './variables'

const styles = theme => ({
  bigviewBtn: {
    // width: 180,
    marginRight: 0,
    minHeight: 55,
    padding: '0px 10px !important',
  },
  longTextBtn: {
    '& span': {
      whiteSpace: 'initial',
    },
    '& svg': {
      width: 50,
      height: 50,
    },
  },
})

const filterByAccessRight = m => {
  const settings = JSON.parse(localStorage.getItem('clinicSettings'))
  const { isEnablePackage = false } = settings
  if (
    (m.url === '/report/wiprevenue' || m.url === '/report/packageexpiry') &&
    !isEnablePackage
  )
    return false

  const accessRight = Authorized.check(m.authority)
  if (
    !accessRight ||
    (accessRight &&
      (accessRight.rights === 'hidden' || accessRight.rights === 'disable'))
  )
    return false
  return true
}

class Report extends React.Component {
  constructor(props) {
    super(props)
    this.group = _.groupBy(menuData, 'title')
  }

  state = {
    searchText: '',
  }

  onFilterChange = event => {
    this.setState({
      searchText: event.target.value.toLowerCase(),
    })
  }

  onButtonClick = event => {
    const { currentTarget } = event

    currentTarget.id !== '' && this.props.history.push(currentTarget.id)
  }

  menus = () => {
    const { classes, theme } = this.props

    return Object.keys(this.group).map(o => {
      const filtered = this.group[o].filter(filterByAccessRight).filter(m => {
        return (
          m.text.toLocaleLowerCase().indexOf(this.state.searchText) >= 0 ||
          !this.state.searchText
        )
      })

      return {
        title: o,
        items: this.group[o],
        itemCount: filtered.length,
        content: (
          <GridContainer style={{ marginTop: theme.spacing(1) }} key={o}>
            {filtered.map(item => {
              const accessRight = Authorized.check(item.authority)
              const isHidden =
                accessRight &&
                (accessRight.rights === 'disable' ||
                  accessRight.rights === 'hidden')
              return (
                !isHidden && (
                  <GridItem
                    key={item.name}
                    xs={4}
                    md={2}
                    style={{ marginBottom: theme.spacing(2) }}
                  >
                    <Button
                      fullWidth
                      color='primary'
                      className={classnames({
                        [classes.bigviewBtn]: true,
                        // [classes.longTextBtn]: item.longText,
                      })}
                      variant='outlined'
                      id={item.url}
                      onClick={this.onButtonClick}
                    >
                      {item.text}
                    </Button>
                  </GridItem>
                )
              )
            })}
          </GridContainer>
        ),
      }
    })
  }

  render() {
    const menus = this.menus().filter(item => item.itemCount > 0)

    return (
      <CardContainer hideHeader>
        <TextField prefix={<Search />} onChange={this.onFilterChange} />
        <Accordion
          defaultActive={0}
          mode={this.state.searchText.length > 0 ? 'multiple' : 'default'}
          collapses={menus.filter(item => {
            return (
              !this.state.searchText ||
              // item.title.toLocaleLowerCase().indexOf(this.state.searchText) >=
              //   0 ||
              item.items.find(
                m =>
                  m.text.toLocaleLowerCase().indexOf(this.state.searchText) >=
                  0,
              )
            )
          })}
        />
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Report)
