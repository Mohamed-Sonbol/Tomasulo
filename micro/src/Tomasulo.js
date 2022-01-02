import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TOPOLOGY from 'vanta/dist/vanta.topology.min'
import * as p5 from 'p5'

let cycle = 0;
let initialregFile = [];
let bus = [];
let memory = Array(128).fill(0);

let memoryCell = '';

let instructions = [];
if (sessionStorage.getItem('instructions'))
  instructions = sessionStorage.getItem('instructions').split("\n");

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
  const [vantaEffect, setVantaEffect] = React.useState(0)
  const myRef = React.useRef(null)

  React.useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(TOPOLOGY({
        el: myRef.current,
        p5: p5,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        color: 0x61877,
        backgroundColor: 0xffffff
      }))
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy()
    }
  }, [vantaEffect])

  React.useEffect(()=>{
    if(!sessionStorage.getItem('refreshed')){
      sessionStorage.setItem('refreshed', true)
      window.location.reload();
    }
  }, [])

  const memoryCellChange = (e) => {
    memoryCell = e.target.value;
    setRefresh(!refresh);
  }

  const next = () => {
    cycle += 1;
    if (instructions.length > 0) {
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
    if (bus.length > 0) {
      a = bus.shift();
      for (var station of mulData) {
        if (station.Qj === a.name) {
          station.Qj = '';
          station.vj = a.value;
        }
        if (station.Qk === a.name) {
          station.Qk = '';
          station.vk = a.value;
        }
        if (station.vj !== '' && station.vk !== '') {
          if (!station.start) {
            station.start = cycle + 1;
          }
        }
      }
      for (var station of addData) {
        if (station.Qj === a.name) {
          station.Qj = '';
          station.vj = a.value;
        }
        if (station.Qk === a.name) {
          station.Qk = '';
          station.vk = a.value;
        }
        if (station.vj !== '' && station.vk !== '') {
          if (!station.start) {
            station.start = cycle + 1;
          }
        }
      }
      for (var reg of regfileData) {
        if (reg.Qi === a.name) {
          reg.Qi = '0';
          reg.value = a.value;
        }
      }
      for (var station of storeData) {
        if (station.Q === a.name) {
          station.Q = '';
          station.V = a.value;
        }
        if (station.V !== '') {
          if (!station.start) {
            station.start = cycle + 1;
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
            if (cycle - station.start === mulLatency - 1) {
              main[station.mainIndex].execution += cycle;
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
          station.start = cycle+1;
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
            if (cycle - station.start === addLatency - 1) {
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
      if (station.busy === 1) {
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
          if (cycle - station.start === storeLatency - 1) {
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

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));
  const theme = createTheme({
    typography: {
      fontFamily: [
        '-apple-system',

      ].join(','),
    },
  });

  return (
    <div ref={myRef} style = {{paddingTop: '1px', marginTop: '-8px', paddingLeft: '1px', marginLeft: '-8px' }}>
      <br />
      <ThemeProvider theme={theme}>
        <Typography variant="h3" >
          Cycle # {cycle}
        </Typography>
      </ThemeProvider>
      <br />
      <br />
      <Grid container spacing={30}>
        <Grid item xs={6} md={8}>
          <TableContainer sx={{ maxWidth: 800, minHeight: 200 }} component={Paper}>
            <Table sx={{ minWidth: 650 }} size="medium" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Instruction</StyledTableCell>
                  <StyledTableCell>j</StyledTableCell>
                  <StyledTableCell>k</StyledTableCell>
                  <StyledTableCell>Issue</StyledTableCell>
                  <StyledTableCell>Execution</StyledTableCell>
                  <StyledTableCell>Write Back</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {main.map((row) => (
                  <TableRow
                    key={row.issue}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <StyledTableCell>{row.instruction}</StyledTableCell>
                    <StyledTableCell>{row.j}</StyledTableCell>
                    <StyledTableCell>{row.k}</StyledTableCell>
                    <StyledTableCell>{row.issue}</StyledTableCell>
                    <StyledTableCell>{row.execution}</StyledTableCell>
                    <StyledTableCell>{row.writeback}</StyledTableCell>
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
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Busy </StyledTableCell>
                  <StyledTableCell>OP </StyledTableCell>
                  <StyledTableCell>vj</StyledTableCell>
                  <StyledTableCell>vk </StyledTableCell>
                  <StyledTableCell>Qj </StyledTableCell>
                  <StyledTableCell>Qk</StyledTableCell>
                  <StyledTableCell>A </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mulData.map((entry) => (
                  <TableRow
                    key={entry.name}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <StyledTableCell>{entry.name}</StyledTableCell>
                    <StyledTableCell>{entry.busy}</StyledTableCell>
                    <StyledTableCell>{entry.op}</StyledTableCell>
                    <StyledTableCell>{entry.vj}</StyledTableCell>
                    <StyledTableCell>{entry.vk}</StyledTableCell>
                    <StyledTableCell>{entry.Qj}</StyledTableCell>
                    <StyledTableCell>{entry.Qk}</StyledTableCell>
                    <StyledTableCell>{entry.A}</StyledTableCell>
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
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Busy </StyledTableCell>
                  <StyledTableCell>OP </StyledTableCell>
                  <StyledTableCell>vj</StyledTableCell>
                  <StyledTableCell>vk </StyledTableCell>
                  <StyledTableCell>Qj </StyledTableCell>
                  <StyledTableCell>Qk</StyledTableCell>
                  <StyledTableCell>A </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addData.map((entry) => (
                  <TableRow
                    key={entry.name}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <StyledTableCell>{entry.name}</StyledTableCell>
                    <StyledTableCell>{entry.busy}</StyledTableCell>
                    <StyledTableCell>{entry.op}</StyledTableCell>
                    <StyledTableCell>{entry.vj}</StyledTableCell>
                    <StyledTableCell>{entry.vk}</StyledTableCell>
                    <StyledTableCell>{entry.Qj}</StyledTableCell>
                    <StyledTableCell>{entry.Qk}</StyledTableCell>
                    <StyledTableCell>{entry.A}</StyledTableCell>
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
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Busy </StyledTableCell>
                  <StyledTableCell>Address </StyledTableCell>
                  <StyledTableCell>V</StyledTableCell>
                  <StyledTableCell>Q</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storeData.map((entry) => (
                  <TableRow
                    key={entry.name}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <StyledTableCell>{entry.name}</StyledTableCell>
                    <StyledTableCell>{entry.busy}</StyledTableCell>
                    <StyledTableCell>{entry.address}</StyledTableCell>
                    <StyledTableCell>{entry.V}</StyledTableCell>
                    <StyledTableCell>{entry.Q}</StyledTableCell>
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
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Busy </StyledTableCell>
                  <StyledTableCell>Address </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadData.map((entry) => (
                  <TableRow
                    key={entry.name}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <StyledTableCell>{entry.name}</StyledTableCell>
                    <StyledTableCell>{entry.busy}</StyledTableCell>
                    <StyledTableCell>{entry.address}</StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <br />
          <br />
          <FormControl variant = 'filled'>
            <InputLabel>Memory</InputLabel>
            <OutlinedInput
              value={memoryCell}
              onChange={memoryCellChange}
              placeholder='0 to 127'
            />
          </FormControl>
          {Number(memoryCell) < memory.length && memoryCell !== '' && <p>Cell {memoryCell} : {memory[Number(memoryCell)]}</p>}
          <br />
          <br />
          <br />
          <Button onClick={next} variant='contained'>Next step</Button>

        </Grid>
        <br />
        <br />
        <Grid item xs={6} md={4}>
          <TableContainer sx={{ maxWidth: 250 }} component={Paper}>
            <Table size="medium" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Register Number#</StyledTableCell>
                  <StyledTableCell>Value </StyledTableCell>
                  <StyledTableCell>Qi </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regfileData.map((entry) => (
                  <StyledTableRow
                    key={entry.registerNumber}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <StyledTableCell>{entry.registerNumber}</StyledTableCell>
                    <StyledTableCell>{entry.value}</StyledTableCell>
                    <StyledTableCell>{entry.Qi}</StyledTableCell>
                  </StyledTableRow >
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <br />
        <br />
      </Grid>


    </div>

  );
}