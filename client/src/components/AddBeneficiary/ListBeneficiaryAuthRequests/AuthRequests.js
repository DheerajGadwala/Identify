import React, { useState, useEffect, useCallback } from "react";
import RequestItem from "./RequestItem/RequestItem";
import Loader from "../../../loader.gif";
import { Grid } from "@material-ui/core";

const AuthRequests = ({ activeAuthority, credManagerInst, distnId }) => {
  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  const getRequests = useCallback(async () => {
    setLoading(true);
    let requestList = await credManagerInst.getPastEvents(
      "BeneficiaryValidation",
      { fromBlock: 0, toBlock: "latest" },
      (err, event) => console.log(event)
    );
    let filteredList = {};
    let authorityRemarks = await credManagerInst.getPastEvents(
      "BeneficiaryValidationRemarks",
      {
        filter: { _dstnId: distnId, _authorityId: activeAuthority },
        fromBlock: 0,
        toBlock: "latest",
      },
      (err, event) => console.log(event)
    );
    let remarks = {};
    authorityRemarks.forEach((remark) => {
      remarks[remark.args._id] = remark.args._comment;
    });
    requestList.reverse().forEach((req) => {
      const data = req.args;
      const _beneficiaryId = data._id;
      const txnStatus = data._statusCode.toNumber();
      if (
        data._dstnId.toNumber() === parseInt(distnId) &&
        txnStatus === 200 &&
        !filteredList[_beneficiaryId]
      ) {
        filteredList[_beneficiaryId] = req;
      }
    });
    setRemarks(remarks);
    setRequests(filteredList);
    setLoading(false);
  }, [credManagerInst, distnId, activeAuthority]);

  useEffect(() => {
    getRequests();
  }, [getRequests]);

  return loading ? (
    <img src={Loader} alt="loader" />
  ) : (
    <Grid container direction="column">
      {Object.keys(requests).map((req, index) => {
        req = requests[req];
        const data = req.args;
        const beneficiaryId = data._id.toNumber();
        return (
          <RequestItem
            key={index}
            id={beneficiaryId}
            finalRegistrationStatus={data._finalStatus.toNumber()}
            authorityId={activeAuthority}
            approvedAuths={data._accepted}
            rejectedAuths={data._rejected}
            getRequests={getRequests}
            distnId={distnId}
            credManagerInst={credManagerInst}
            setLoading={setLoading}
            remark={remarks[beneficiaryId]}
          />
        );
      })}
    </Grid>
  );
};

export default AuthRequests;
