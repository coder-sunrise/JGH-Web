import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles'
import Computer from '@material-ui/icons/Computer'
import Chat from '@material-ui/icons/Chat'

import { downloadTeamviewer } from '../download'
import logoPic from '@/assets/img/contacttop.jpg'

import { GridContainer, CardContainer, GridItem } from '@/components'

class Teamviewer extends PureComponent {
  render() {
    const imgStyle = {
      backgroundImage: `url(${logoPic})`,
      width: '100%',
      height: '300px',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '50% 50%',
      display: 'block',
      overflow: 'hidden',
    }
    const centerAlignStyle = {
      alignItems: 'center',
      textAlign: 'center',
      display: 'inline-block',
    }

    return (
      <GridContainer>
        <GridItem xs={12} md={12} style={{ padding: 0 }}>
          <React.Fragment>
            <div style={imgStyle} />
          </React.Fragment>
        </GridItem>
        <GridItem xs={4} md={4} />
        <GridItem
          xs={4}
          md={4}
          style={{
            alignItems: 'center',
            textAlign: 'center',
            margin: 20,
            marginBottom: 30,
          }}
        >
          <CardContainer
            hideHeader
            style={{
              width: 560,
              ...centerAlignStyle,
            }}
          >
            <GridContainer>
              <GridItem xs={12} md={12}>
                <Chat
                  style={{
                    width: 50,
                    height: 50,
                    fill: '#1296db',
                  }}
                />
              </GridItem>
              <GridItem xs={12} md={12}>
                <React.Fragment>
                  <h4>Contact Customer Support</h4>
                </React.Fragment>
              </GridItem>
              <GridItem xs={12} md={12}>
                <React.Fragment>
                  <div>
                    <h3>
                      Sometimes you need a little help from our support rep.
                      Don't worry... we're here for you.
                    </h3>
                  </div>
                </React.Fragment>
              </GridItem>
            </GridContainer>
          </CardContainer>
        </GridItem>
        <GridItem
          xs={4}
          md={4}
          style={{
            alignItems: 'right',
            textAlign: 'right',
            alignSelf: 'center',
          }}
        >
          <Computer
            style={{
              width: 100,
              height: 100,
              marginRight: 50,
              fill: '#1296db',
            }}
          />
        </GridItem>
        <GridItem
          xs={4}
          md={4}
          style={{ marginLeft: 20, marginBottom: 10, ...centerAlignStyle }}
        >
          <React.Fragment>
            <div
              style={{ textAlign: 'left', display: 'inline-block', width: 550 }}
            >
              <h3>
                <b> Call-In or Email Support</b>
              </h3>
              <div style={{ marginLeft: 10, fontSize: 16 }}>
                <p>Our support engineers are standing by to help.</p>
                <p style={{ marginTop: 10 }}>
                  Contact 6283 5016 (Press 3) or email to{' '}
                  <span style={{ color: '#4255bd' }}>
                    semr_support@medinno.com
                  </span>
                </p>
                <div style={{ marginTop: 10 }}>
                  <div>Operating Hours:</div>
                  <div>
                    <div>09:00 - 18:00 (Mon - Fri)</div>
                    <div>
                      18:00 - 21:00 (Mon - Fri) or 09:00 - 18:00 (Sat - Sun)
                      only URGENT cases
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: 10 }}>
                  Download&nbsp;
                  <a
                    target='_blank'
                    href='https://www.teamviewer.com/en/download/windows/'
                  >
                    TeamViewer
                  </a>
                  &nbsp; for better support.
                </p>
              </div>
            </div>
          </React.Fragment>
        </GridItem>
        <GridItem xs={4} md={4} />
      </GridContainer>
    )
  }
}
export default withStyles({}, { withTheme: true })(Teamviewer)
