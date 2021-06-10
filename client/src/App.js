import React, { useEffect, useState } from "react";
import getWeb3 from "./getWeb3";
import { Button, Grid } from "@material-ui/core";
import Loader from "./loader.gif";
import "./App.css";
import TxnForm from "./components/txnForm/txnForm";
import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import TxnList from "./components/txnList/txnList";
import TruffleContract from "@truffle/contract";
import CredManager from "./contracts/CredentialManager.json";
import AckTxn from "./components/ackTxn/ackTxn.js";
import { districtsList } from "./districtsList.js";
import Admin from "./components/Admin/Admin";
import AddBeneficiary from "./components/AddBeneficiary/AddBeneficiary";

const PrivateKeyProvider = require("@truffle/hdwallet-provider");
const privateKeys = [
  "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
  "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
  "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
];

const privateKeyProvider = new PrivateKeyProvider(
  privateKeys,
  "http://127.0.0.1:8545",
  0,
  3
);

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [view, setView] = useState("home");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [dstnPoints, setDstnPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credManagerInst, setCredManagerInst] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const web3 = await getWeb3();
      const credManagerContract = TruffleContract(CredManager);
      credManagerContract.setProvider(web3.currentProvider);
      const credManagerInstance = await credManagerContract.deployed();
      await Promise.all([
        loadData(credManagerInstance, "NewState", setStates),
        loadData(credManagerInstance, "NewDistrict", setDistricts),
        loadData(credManagerInstance, "NewDstnPoint", setDstnPoints),
      ]);
      setWeb3(web3);
      setCredManagerInst(credManagerInstance);
      setLoading(false);
    })();
  }, []);

  const loadData = async (credManagerInstance, eventName, stateFn) => {
    const data = await credManagerInstance.getPastEvents(
      eventName,
      {
        fromBlock: 0,
        toBlock: "latest",
      },
      (err, data) => console.log(data)
    );
    stateFn(data);
  };

  // const userIds = [
  //   557284942059,
  //   682810563520,
  //   769816380811,
  //   888277646897,
  //   859079831141,
  //   754084584111,
  //   890910200564,
  //   861300230164,
  //   988200735669,
  //   888194596202,
  // ];
  // const userCred = [
  //   "2wTcWdsR5o",
  //   "xIwza35UbW",
  //   "1MJk4JemUn",
  //   "4GXZHSKxx5",
  //   "s20F4tZgZg",
  //   "Voq9d2qnoO",
  //   "Mf3isL3ScI",
  //   "kQK8gaerT7",
  //   "GIzIcMzv5d",
  //   "ofE4zUTwL5",
  // ];

  // const dstnAuthIds = [
  //   "0x3C28961eeB55d82b212B848DD779f7467D77a1A4",
  //   "0xAB6e2c81675bb30411054F915e04393FA9D20441",
  //   "0xE8C26fC27209066C4d2F0ca9703B2c4B604904B5",
  //   "0x173897136202ef44a2fe1FCFabE701BBcf2e63Cb",
  //   "0x95a47709161254C39343F54463F6334B5f42c8c5",
  // ];

  // const distAuthIds = [
  //   "0xA95E385E92896A4153bbE46Cd19BABa023Bd9A99",
  //   "0x408a27555fA2cCC0D2136528Ae2F33199838cb5B",
  //   "0x58bdf2A80035651f72950A58E92D6512CD98FCd2",
  //   "0x1bcde4EeDb36af11bCdCfb2927D94AAA04bB8F5f",
  //   "0x569eBff94e66a2fea1905065A687F1daF343E7A5",
  // ];

  // const stateAuthIds = [
  //   "0x2458Fc4B8151efE21e524C9c96c927282B642437",
  //   "0xfcbd5041f972850e686ccD4347D97475C7fEc4F6",
  //   "0x47f5851B01403C08c4860a6701d9773191E98f21",
  // ];
  const theme = createMuiTheme({
    palette: {
      primary: {
        main: "#000",
      },
      secondary: {
        main: "#fff",
      },
      error: {
        main: "#f5f5f5",
      },
    },
    typography: {
      fontFamily: "Lato",
    },
    props: {
      MuiSelect: {
        color: "secondary",
      },
      MuiInputLabel: {
        color: "secondary",
      },
      MuiTextField: {
        color: "secondary",
      },
    },
    overrides: {
      MuiFormLabel: {
        root: {
          letterSpacing: "0.05em",
        },
      },
      MuiInputBase: {
        input: {
          letterSpacing: "0.03em",
          color: "#000",
        },
      },
    },
  });

  // const createUsers = async () => {
  //   const accounts = await window.ethereum.request({
  //     method: "eth_requestAccounts",
  //   });
  //   for (let i = 0; i < 10; i++) {
  //     await credManagerInst.addBeneficiary(userIds[i], userCred[i], {
  //       from: accounts[0],
  //     });
  //   }
  // };

  // const addDstnPoints = async () => {
  //   const accounts = await window.ethereum.request({
  //     method: "eth_requestAccounts",
  //   });
  //   let j = 0;
  //   for (let i = 0; i < 10; i += 2) {
  //     await credManagerInst.addDstnPoint(
  //       [userIds[i], userIds[i + 1]],
  //       dstnAuthIds[j],
  //       { from: accounts[0] }
  //     );
  //     j++;
  //   }
  // };

  const addDstnPoints = async () => {
    console.log("adding");

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    //added 2 dstnpoints each for 10 districts
    let j = 0;
    for (let i = 1; i <= 13; i++) {
      const txn = await credManagerInst.addDstnPoint("DstnPt-" + j++, i, {
        from: accounts[0],
      });
      console.log("txn for " + j + " : " + txn + "\n");
      const txn1 = await credManagerInst.addDstnPoint("DstnPt-" + j++, i, {
        from: accounts[0],
      });
      console.log("txn for " + j + " : " + txn1 + "\n");
    }
  };

  const addDistricts = async () => {
    console.log("ADding");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    let dsts = 10;

    for (let i = 0; i < 1; i++) {
      let dstsLen = districtsList[i].length;
      console.log("state-" + (i + 1));
      for (let j = 0; j < dstsLen; j++) {
        const dstName = districtsList[i][j];
        console.log("adding " + dstName);
        const txn = await credManagerInst.addDistrict(dstName, i + 1, {
          from: accounts[0],
        });
        console.log("txn for " + dstName + " : " + txn + "\n");
      }
    }
  };

  const Content = () => {
    if (view === "home")
      return (
        <Grid container className="App" alignItems="center" direction="column">
          <Grid item className="headerContainer">
            <h1 className="header">identify</h1>
          </Grid>
          {loading ? (
            <Grid item className="appLoader">
              <img src={Loader} alt="loader" />
            </Grid>
          ) : (
            <>
              <Grid item>
                <Button
                  className="buttonPrimary"
                  onClick={() => setView("txnForm")}
                >
                  Send Resources
                </Button>
              </Grid>
              <Grid item>
                <Button
                  className="buttonPrimary"
                  onClick={() => setView("txnList")}
                >
                  View Transactions
                </Button>
              </Grid>
              <Grid item>
                <Button
                  className="buttonPrimary"
                  onClick={() => setView("ackRecpt")}
                >
                  Acknowledge Receipt
                </Button>
              </Grid>
              <Grid item>
                <Button
                  className="buttonSecondary"
                  onClick={() => setView("admin")}
                >
                  Admin
                </Button>
              </Grid>
              <Grid item>
                <Button
                  className="buttonSecondary"
                  onClick={() => setView("add beneficiary")}
                >
                  Add Beneficiary
                </Button>
              </Grid>
            </>
          )}

          {/* <Button
            onClick={() => {
              addDstnPoints();
              console.log("hi");
            }}
          >
            Add Districts
          </Button> */}
          {/* <Button onClick={() => addDstnPoints()}>Add dntnPoints</Button>
          <Button onClick={() => addDistricts()}>Add Districts</Button>
          <Button onClick={() => addStates()}>Add states</Button> */}
        </Grid>
      );
    else if (view === "txnForm")
      return (
        <TxnForm
          web3={web3}
          setView={setView}
          states={states}
          districts={districts}
          dstnPoints={dstnPoints}
          credManagerInstance={credManagerInst}
        />
      );
    else if (view === "txnList")
      return (
        <TxnList
          web3={web3}
          setView={setView}
          states={states}
          districts={districts}
          dstnPoints={dstnPoints}
        />
      );
    else if (view === "ackRecpt")
      return (
        <AckTxn
          web3={web3}
          setView={setView}
          credManagerInstance={credManagerInst}
        />
      );
    else if (view === "admin")
      return (
        <Admin
          setView={setView}
          web3={web3}
          states={states}
          districts={districts}
          dstnPoints={dstnPoints}
          credManagerInst={credManagerInst}
        />
      );
    else if (view === "add beneficiary")
      return (
        <AddBeneficiary
          setView={setView}
          web3={web3}
          dstnPoints={dstnPoints}
          credManagerInst={credManagerInst}
        />
      );
  };

  return (
    <ThemeProvider theme={theme}>
      <Content />
    </ThemeProvider>
  );
};

export default App;
