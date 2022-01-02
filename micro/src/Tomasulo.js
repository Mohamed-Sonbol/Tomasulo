import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';

let cycle = 0;
let initialregFile = [];
let bus = [];
let memory = Array(128).fill(5);

let instructions = sessionStorage.getItem('instructions').split("\n");
let addLatency = Number(sessionStorage.getItem('add_sub'))
let mulLatency = Number(sessionStorage.getItem('mul'))
let divLatency = Number(sessionStorage.getItem('div'))
let loadLatency = Number(sessionStorage.getItem('load'))
let storeLatency = Number(sessionStorage.getItem('store'))

function intializeregFile() {
  for (var i = 0; i < 32; i++) {
    initialregFile.push(createRegData('F' + i, 0, '0'));
  }
  return initialregFile;
}
let regfileData = intializeregFile();

function createData(instruction, j, k, issue, execution, writeback) {
  return { instruction, j, k, issue, execution, writeback };
}

function createRegData(registerNumber, value, Qi) {
  return { registerNumber, value, Qi };
}

function createALUbuffer(name, busy, op, vj, vk, Qj, Qk, A, start, mainIndex) {
  return { name, busy, op, vj, vk, Qj, Qk, A, start, mainIndex };
}

function createStoreBuffer(name, busy, address, V, Q, start, mainIndex) {
  return { name, address, busy, V, Q, start, mainIndex };
}
function createLoadBuffer(name, busy, address, start, mainIndex) {
  return { name, busy, address, start, mainIndex };
}

let main = [

];

let mulData = [
  createALUbuffer('M1', 0, '', '', '', '', '', '', null, null),
  createALUbuffer('M2', 0, '', '', '', '', '', '', null, null)
];
let addData = [
  createALUbuffer('A1', 0, '', '', '', '', '', '', null, null),
  createALUbuffer('A2', 0, '', '', '', '', '', '', null, null),
  createALUbuffer('A3', 0, '', '', '', '', '', '', null, null)
];

let loadData = [
  createLoadBuffer('L1', 0, '', null, null),
  createLoadBuffer('L2', 0, '', null, null),
  createLoadBuffer('L3', 0, '', null, null)
];

let storeData = [
  createStoreBuffer('S1', 0, '', '', '', null, null),
  createStoreBuffer('S2', 0, '', '', '', null, null),
  createStoreBuffer('S3', 0, '', '', '', null, null)
];


export default function Tomasulo() {
  const [refresh, setRefresh] = React.useState(false);

  const next = () => {
    cycle += 1;
    console.log(memory);
    if (instructions.length > 0 ){
    let current = instructions.shift();
    let stall = false; //Logic ma3koos
    let splitCurrent = current.split(' ');

    switch (splitCurrent[0]) {
      case "L.D": for (var i = 0; i < 3; i++) {
        if (loadData[i].busy === 0) {
          stall = issue(i, splitCurrent, "load");
          break;
        }
      }; break;
      case "S.D": for (var i = 0; i < 3; i++) {
        if (storeData[i].busy === 0) {
          stall = issue(i, splitCurrent, "store");
          break;
        }
      }; break;
      case "MUL.D": for (var i = 0; i < 2; i++) {
        if (mulData[i].busy === 0) {
          stall = issue(i, splitCurrent, "mul");
          break;
        }
      }; break;
      case "DIV.D": for (var i = 0; i < 2; i++) {
        if (mulData[i].busy === 0) {
          stall = issue(i, splitCurrent, "mul");
          break;
        }
      }; break;
      case "ADD.D": for (var i = 0; i < 3; i++) {
        if (addData[i].busy === 0) {
          stall = issue(i, splitCurrent, "add");
          break;
        }
      }; break;
      case "SUB.D": for (var i = 0; i < 3; i++) {
        if (addData[i].busy === 0) {
          stall = issue(i, splitCurrent, "add");
          break;
        }
      }; break;
      default: console.log("unknown instruction"); break;
    }

    if (!stall) {
      instructions.unshift(current);
    }

  }// end of fetch and decode 
    execute();

    announce();

    setRefresh(!refresh);
  }
  const announce = () => {
    let a;   //announcement
    if(bus.length > 0){
      a = bus.shift();
      for (var station of mulData){
        if(station.Qj === a.name){
          station.Qj = '';
          station.vj = a.value;
        }
        if(station.Qk === a.name){
          station.Qk = '';
          station.vk = a.value ;
        }
        if (station.vj !== '' && station.vk !== '') {
          if (!station.start) {
            station.start = cycle + 1;
          }
        }
      }
      for (var station of addData){
        if(station.Qj === a.name){
          station.Qj = '';
          station.vj = a.value ;
        }
        if(station.Qk === a.name){
          station.Qk = '';
          station.vk = a.value ;
        }
        if (station.vj !== '' && station.vk !== '') {
          if (!station.start) {
            station.start = cycle + 1;
          }
        }
      }
      for (var reg of regfileData){
        if(reg.Qi === a.name){
          reg.Qi = '0';
          reg.value = a.value ;
        }
      }
      for (var station of storeData){
        if(station.Q === a.name){
          station.Q = '';
          station.V = a.value ;
        }
        if (station.V !== '') {
          if (!station.start) {
            station.start = cycle + 1 ;
          }
        }
      }
      main[a.mainIndex].writeback = cycle;
    }
  }

  const execute = () => {
    for (var station of mulData) {
      if (station.vj !== '' && station.vk !== '') {
        if (!station.start) {
          station.start = cycle + 1;
        }
        else {
          if (station.start === cycle) {
            main[station.mainIndex].execution = station.start + " ..  ";
          }
          if (station.op === "MUL.D") {
            if (cycle - station.start  === mulLatency - 1) {
              main[station.mainIndex].execution += cycle ;
            }
            else if (cycle - station.start === mulLatency) {
              bus.push({
                name: station.name,
                mainIndex: station.mainIndex,
                value: (station.vj * station.vk)
              })

              //(name, busy, op, vj, vk, Qj, Qk, A ,start,mainIndex)
              station.busy = 0;
              station.op = '';
              station.vj = '';
              station.vk = '';
              station.Qj = '';
              station.Qk = '';
              station.start = null;
              station.mainIndex = null;
            }
          }

          else {
            if (cycle - station.start === divLatency - 1) {
              main[station.mainIndex].execution += cycle;
            }
            else if (cycle - station.start === divLatency) {
              bus.push({
                name: station.name,
                mainIndex: station.mainIndex,
                value: ((station.vj * 1.0) / station.vk)
              })
              //(name, busy, op, vj, vk, Qj, Qk, A ,start,mainIndex)
              station.busy = 0;
              station.op = '';
              station.vj = '';
              station.vk = '';
              station.Qj = '';
              station.Qk = '';
              station.start = null;
              station.mainIndex = null;
            }
          }

        }
      }
    }// end of mulTable
    for (var station of addData) {
      if (station.vj !== '' && station.vk !== '') {
        if (!station.start) {
          station.start = cycle ;
        }
        else {
          if (station.start === cycle) {
            main[station.mainIndex].execution = station.start + " ..  ";
          }
          if (station.op === "ADD.D") {
            if (cycle - station.start === addLatency - 1) {
              main[station.mainIndex].execution += cycle;
            }
            else if (cycle - station.start === addLatency) {
              bus.push({
                name: station.name,                
                mainIndex: station.mainIndex,
                value: (station.vj + station.vk)
              })

              //(name, busy, op, vj, vk, Qj, Qk, A ,start,mainIndex)
              station.busy = 0;
              station.op = '';
              station.vj = '';
              station.vk = '';
              station.Qj = '';
              station.Qk = '';
              station.start = null;
              station.mainIndex = null;
            }
          }

          else {
            if (cycle - station.start  === addLatency - 1) {
              main[station.mainIndex].execution += cycle;
            }
            else if (cycle - station.start === addLatency) {
              bus.push({
                name: station.name,
                mainIndex: station.mainIndex,
                value: (station.vj - station.vk)
              })
              //(name, busy, op, vj, vk, Qj, Qk, A ,start,mainIndex)
              station.busy = 0;
              station.op = '';
              station.vj = '';
              station.vk = '';
              station.Qj = '';
              station.Qk = '';
              station.start = null;
              station.mainIndex = null;
            }
          }

        }
      }
    }// end of addTable
    for (var station of loadData) {
      if(station.busy === 1){
      if (!station.start) {
        station.start = cycle + 1;
      }
      else {
        if (station.start === cycle) {
          main[station.mainIndex].execution = station.start + " ..  ";
        }
        if (cycle - station.start === loadLatency - 1) {
          main[station.mainIndex].execution += cycle;
        }
        else if (cycle - station.start === loadLatency) {
          bus.push({
            name: station.name,
            mainIndex: station.mainIndex,
            value: memory[station.address]
          })

          //(name, busy, address,start,mainIndex)
          // 0, '', null, null
          station.busy = 0;
          station.address = '';
          station.start = null;
          station.mainIndex = null;
        }
      }
    }
    } // end of loadTable

    for (var station of storeData) {
      if (station.V !== '') {
        if (!station.start) {
          station.start = cycle + 1;
        }

        else {
          if (station.start === cycle) {
            main[station.mainIndex].execution = station.start + " ..  ";
          }
          if (cycle - station.start  === storeLatency- 1) {
            main[station.mainIndex].execution += cycle;
          }
          else if (cycle - station.start === storeLatency) {
            memory[station.address] = station.V;
            bus.push({
              mainIndex: station.mainIndex 
            })
            //(name, busy, address, V, Q,start,mainIndex)
            // ('S1', 0, '', '', '', null, null)
            station.busy = 0;
            station.address = '';
            station.V = '';
            station.Q = '';
            station.start = null;
            station.mainIndex = null;
          }
        }
      }
    }// end of storeTable


  }



  const issue = (i, inst, type) => {
    let index = Number(inst[1].substring(1));
    switch (type) {
      case "load": {
        loadData[i].busy = 1;
        loadData[i].address = inst[2];
        regfileData[index].Qi = loadData[i].name;
        main.push(createData(inst[0] + "        " + inst[1], '0', inst[2], cycle, '', ''));
        loadData[i].mainIndex = main.length - 1;
      }; break;
      case "store": {
        storeData[i].busy = 1;
        storeData[i].address = inst[2];
        if (regfileData[index].Qi === '0') {
          storeData[i].V = regfileData[index].value;
        }
        else {
          storeData[i].Q = regfileData[index].Qi;
        }
        main.push(createData(inst[0] + "        " + inst[1], '0', inst[2], cycle, '', ''));
        storeData[i].mainIndex = main.length - 1;
      }; break;
      case "mul": {
        // name, busy, op, vj, vk, Qj, Qk, A ,start
        // mulData
        mulData[i].busy = 1;
        mulData[i].op = inst[0];
        let j = Number(inst[2].substring(1))
        let k = Number(inst[3].substring(1))
        if (regfileData[j].Qi === '0') {
          mulData[i].vj = regfileData[j].value;
        }
        else {
          mulData[i].Qj = regfileData[j].Qi;
        }
        if (regfileData[k].Qi === '0') {
          mulData[i].vk = regfileData[k].value;
        }
        else {
          mulData[i].Qk = regfileData[k].Qi;
        }
        regfileData[index].Qi = mulData[i].name;
        main.push(createData(inst[0] + "        " + inst[1], inst[2], inst[3], cycle, '', ''));
        mulData[i].mainIndex = main.length - 1;

      }; break;

      case "add": {
        // name, busy, op, vj, vk, Qj, Qk, A ,start
        // addData
        addData[i].busy = 1;
        addData[i].op = inst[0];
        let j = Number(inst[2].substring(1))
        let k = Number(inst[3].substring(1))
        if (regfileData[j].Qi === '0') {
          addData[i].vj = regfileData[j].value;
        }
        else {
          addData[i].Qj = regfileData[j].Qi;
        }
        if (regfileData[k].Qi === '0') {
          addData[i].vk = regfileData[k].value;
        }
        else {
          addData[i].Qk = regfileData[k].Qi;
        }
        regfileData[index].Qi = addData[i].name;
        main.push(createData(inst[0] + "        " + inst[1], inst[2], inst[3], cycle, '', ''));
        addData[i].mainIndex = main.length - 1;
      }; break;

      default: console.log("something went wrong");
    }
    return true;
  }

  return (
    <div>
      <h1>Cycle : {cycle}</h1>
      <Grid container spacing={2}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="medium" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Instruction</TableCell>
                <TableCell>j</TableCell>
                <TableCell>k</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Execution</TableCell>
                <TableCell>Write Back</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {main.map((row) => (
                <TableRow
                  key={row.issue}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{row.instruction}</TableCell>
                  <TableCell>{row.j}</TableCell>
                  <TableCell>{row.k}</TableCell>
                  <TableCell>{row.issue}</TableCell>
                  <TableCell>{row.execution}</TableCell>
                  <TableCell>{row.writeback}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <br />
        <br />
        <TableContainer sx={{ maxWidth: 800, maxHeight: 170 }} component={Paper}>
          <Table size="medium" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Busy </TableCell>
                <TableCell>OP </TableCell>
                <TableCell>vj</TableCell>
                <TableCell>vk </TableCell>
                <TableCell>Qj </TableCell>
                <TableCell>Qk</TableCell>
                <TableCell>A </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mulData.map((entry) => (
                <TableRow
                  key={entry.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.busy}</TableCell>
                  <TableCell>{entry.op}</TableCell>
                  <TableCell>{entry.vj}</TableCell>
                  <TableCell>{entry.vk}</TableCell>
                  <TableCell>{entry.Qj}</TableCell>
                  <TableCell>{entry.Qk}</TableCell>
                  <TableCell>{entry.A}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <br />
        <br />
        <TableContainer sx={{ maxWidth: 800, maxHeight: 245 }} component={Paper}>
          <Table size="medium" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Busy </TableCell>
                <TableCell>OP </TableCell>
                <TableCell>vj</TableCell>
                <TableCell>vk </TableCell>
                <TableCell>Qj </TableCell>
                <TableCell>Qk</TableCell>
                <TableCell>A </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addData.map((entry) => (
                <TableRow
                  key={entry.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.busy}</TableCell>
                  <TableCell>{entry.op}</TableCell>
                  <TableCell>{entry.vj}</TableCell>
                  <TableCell>{entry.vk}</TableCell>
                  <TableCell>{entry.Qj}</TableCell>
                  <TableCell>{entry.Qk}</TableCell>
                  <TableCell>{entry.A}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <br />
        <br />
        <TableContainer sx={{ maxWidth: 800, maxHeight: 350 }} component={Paper}>
          <Table size="medium" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Busy </TableCell>
                <TableCell>Address </TableCell>
                <TableCell>V</TableCell>
                <TableCell>Q</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {storeData.map((entry) => (
                <TableRow
                  key={entry.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.busy}</TableCell>
                  <TableCell>{entry.address}</TableCell>
                  <TableCell>{entry.V}</TableCell>
                  <TableCell>{entry.Q}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <br />
        <br />
        <TableContainer sx={{ maxWidth: 800, maxHeight: 230 }} component={Paper}>
          <Table size="medium" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Busy </TableCell>
                <TableCell>Address </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadData.map((entry) => (
                <TableRow
                  key={entry.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.busy}</TableCell>
                  <TableCell>{entry.address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <br />
        <br />
        <TableContainer sx={{ maxWidth: 250 }} component={Paper}>
          <Table size="medium" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Register Number#</TableCell>
                <TableCell>Value </TableCell>
                <TableCell>Qi </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regfileData.map((entry) => (
                <TableRow
                  key={entry.registerNumber}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{entry.registerNumber}</TableCell>
                  <TableCell>{entry.value}</TableCell>
                  <TableCell>{entry.Qi}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <br />
        <br />
      </Grid>
      <Button onClick={next}>Next step</Button>

    </div>

  );
}