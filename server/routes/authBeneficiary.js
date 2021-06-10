const express = require("express");
const router = express.Router();
const Web3 = require("web3");
const TruffleContract = require("@truffle/contract");
const CredManagerInterface = require("../contracts/CredentialManager.json");
const fetch = require("node-fetch");
const https = require("https");
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const CryptoJS = require("crypto-js");
const secret = "identify@capstone";

if (typeof web3 !== "undefined") {
  var web3 = new Web3(web3.currentProvider);
} else {
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const decryptWithAES = (ciphertext, secret) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
};

router.post("/", async (req, res, next) => {
  const credManagerContract = TruffleContract(CredManagerInterface);
  credManagerContract.setProvider(web3.currentProvider);
  const credManagerInstance = await credManagerContract.deployed();

  const requestData = req.body;
  const beneficiaryId = parseInt(requestData.toEntity);

  const beneficiaryData = await credManagerInstance.beneficiaries(
    beneficiaryId
  );
  console.log(beneficiaryData);
  const finalStatus = beneficiaryData.finalStatus.toNumber();
  if (finalStatus === 1) {
    const credentialResponse = await fetch(
      "https://ipfs.infura.io/ipfs/" +
        decryptWithAES(beneficiaryData.credentials, secret),
      {
        agent: httpsAgent,
      }
    );
    const credentialData = await credentialResponse.json();
    await fetch("https://face-verification2.p.rapidapi.com/faceverification", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-rapidapi-key": "3d15874e0amshf1bdb48a55c5499p100e08jsn9ee781838fa3",
        "x-rapidapi-host": "face-verification2.p.rapidapi.com",
      },
      body: new URLSearchParams({
        image1Base64: requestData.credentials.image,
        image2Base64: credentialData.image,
      }),
    })
      .then((resp) => resp.json())
      .then((json) => {
        const similar =
          json.data.resultMessage.trim() ===
          "The two faces belong to the same person.";
        const responseData = {
          ...requestData,
          similar: similar,
          token: web3.utils.soliditySha3(
            { type: "string", value: requestData.fromEntity },
            { type: "uint", value: requestData.fromEntityId },
            { type: "string", value: requestData.toEntity },
            { type: "uint", value: requestData.toEntityId },
            { type: "string", value: requestData.entityLevel },
            { type: "uint", value: requestData.sentTimestamp },
            { type: "uint", value: requestData.recvdTimestamp },
            { type: "uint[]", value: requestData.resourceQuantities },
            { type: "string", value: secret },
            { type: "bool", value: similar }
          ),
        };
        res.send(responseData);
      })
      .catch((err) => res.status(300).send("Server Error"));
  } else {
    res.status(400).send(`${finalStatus}`);
  }
});

module.exports = router;
