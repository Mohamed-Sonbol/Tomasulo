
import React, { Component } from 'react'
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput'
import Button from '@mui/material/Button';
import { Navigate } from 'react-router-dom'
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Grid from '@mui/material/Grid';

export default class Latency extends Component {
  state = {
    add_sub: '',
    mul: '',
    div: '',
    load: '',
    store: '',
    instructions: '',
    toSulo: false
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
      <div align="center">
        <h1>Insert your latencies</h1>
        <br />
        <FormControl>
          <InputLabel>ADD/SUB</InputLabel>
          <OutlinedInput
            name='add_sub'
            value={this.state.add_sub}
            onChange={this.handleChange}
          />
        </FormControl>

        <FormControl>
          <InputLabel>MUL</InputLabel>
          <OutlinedInput
            name='mul'
            value={this.state.mul}
            onChange={this.handleChange}
          />
        </FormControl>
        <br />
        <FormControl>
          <InputLabel>DIV</InputLabel>
          <OutlinedInput
            name='div'
            value={this.state.div}
            onChange={this.handleChange}
          />
        </FormControl>
        <br />

        <FormControl>
          <InputLabel>Load</InputLabel>
          <OutlinedInput
            name='load'
            value={this.state.load}
            onChange={this.handleChange}
          />
        </FormControl>

        <FormControl>
          <InputLabel>Store</InputLabel>
          <OutlinedInput
            name='store'
            value={this.state.store}
            onChange={this.handleChange}
          />
        </FormControl>

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

        <Button onClick={this.handleClick} variant='contained'>To Tomasulo</Button>
        {this.state.toSulo && (<Navigate to='/Tomasulo' />)}
      </div>
    )
  }
}
