
import React, { Component } from 'react'
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput'
import Button from '@mui/material/Button';
import { Navigate } from 'react-router-dom'
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Grid from '@mui/material/Grid';
import * as THREE from "three";
import WAVES from "vanta/dist/vanta.waves.min.js";

export default class Latency extends Component {
  constructor() {
    super();
    this.vantaRef = React.createRef();
  }
  state = {
    add_sub: '',
    mul: '',
    div: '',
    load: '',
    store: '',
    instructions: '',
    toSulo: false
  }

  componentDidMount() {
    sessionStorage.removeItem('refreshed')
    this.vantaEffect = WAVES({
      el: this.vantaRef.current,
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      minHeight: 753.00,
      minWidth: 1536.00,
      color: 0x5588
    });
  }
  componentWillUnmount() {
    if (this.vantaEffect) {
      this.vantaEffect.destroy();
    }
  }
  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleClick = () => {
    sessionStorage.setItem('add_sub', this.state.add_sub)
    sessionStorage.setItem('mul', this.state.mul)
    sessionStorage.setItem('div', this.state.div)
    sessionStorage.setItem('load', this.state.load)
    sessionStorage.setItem('store', this.state.store)
    sessionStorage.setItem('instructions', this.state.instructions)

    this.setState({
      toSulo: true
    })
  }

  render() {
    return (

      <div id="wrapper">
        <div className='background' ref={this.vantaRef} style = {{paddingTop: '1px', marginTop: '-8px', paddingLeft: '1px', marginLeft: '-8px' }}>
          <div align="center">
            <h1>Insert your latencies</h1>
            <br />

            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
              <Grid item xs={6} md={12} container justifyContent="center" alignItems="center">
                <Grid item>
                  <FormControl sx={{ minWidth: 450 }}>
                    <InputLabel>ADD/SUB</InputLabel>
                    <OutlinedInput
                      name='add_sub'
                      value={this.state.add_sub}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Grid item container justifyContent="center" alignItems="center">
                <Grid item xs={1.8}>
                  <FormControl>
                    <InputLabel>MUL</InputLabel>
                    <OutlinedInput
                      name='mul'
                      value={this.state.mul}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={1.8}>
                  <FormControl>
                    <InputLabel>DIV</InputLabel>
                    <OutlinedInput
                      name='div'
                      value={this.state.div}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Grid item container justifyContent="center" alignItems="center">
                <Grid item xs={1.8}>
                  <FormControl>
                    <InputLabel>Load</InputLabel>
                    <OutlinedInput
                      name='load'
                      value={this.state.load}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={1.8}>
                  <FormControl>
                    <InputLabel>Store</InputLabel>
                    <OutlinedInput
                      name='store'
                      value={this.state.store}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            <br />
            <br />

            <h1>Your Instructions</h1>

            <FormControl sx={{ minHeight: 100 }}>
              <TextareaAutosize
                placeholder="Instructions"
                style={{ width: 435, height: 250 }}
                name='instructions'
                value={this.state.instructions}
                onChange={this.handleChange}
              />
            </FormControl>

            <br />
            <br />

            <Button onClick={this.handleClick} variant='contained' disabled={this.state.add_sub === '' || this.state.div === '' || this.state.instructions === ''
              || this.state.load === '' || this.state.mul === '' || this.state.store === ''}>
              To Tomasulo
            </Button>
            {this.state.toSulo && (<Navigate to='/Tomasulo' />)}

          </div>
        </div>
      </div>
    )
  }
}
