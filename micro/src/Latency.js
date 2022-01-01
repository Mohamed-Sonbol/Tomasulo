
import React, { Component } from 'react'
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput'
import Button from '@mui/material/Button';
import { Navigate } from 'react-router-dom'

export default class Latency extends Component {
  state = {
    add_sub: '',
    mul_div: '',
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
    sessionStorage.setItem('mul_div', this.state.mul_div)
    sessionStorage.setItem('load', this.state.load)
    sessionStorage.setItem('store', this.state.store)
    sessionStorage.setItem('instructions', this.state.instructions)

    this.setState({
      toSulo: true
    })
  }

  render() {
    return (
      <div className="center">
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

        <br />
        <br />

        <FormControl>
          <InputLabel>MUL/DIV</InputLabel>
          <OutlinedInput
            name='mul_div'
            value={this.state.mul_div}
            onChange={this.handleChange}
          />
        </FormControl>

        <br />
        <br />

        <FormControl>
          <InputLabel>Load</InputLabel>
          <OutlinedInput
            name='load'
            value={this.state.load}
            onChange={this.handleChange}
          />
        </FormControl>

        <br />
        <br />

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

        <FormControl>
          <InputLabel>Instructions</InputLabel>
          <OutlinedInput
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
