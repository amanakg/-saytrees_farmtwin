exports.sendListResponse = (res, results, message) => {
  if ((results && results.length > 0) || Object.keys(results).length > 0) {
    return res.status(200).json({
      status: 1,
      data: results,
      message : message
    });
  } else {
    return res.status(200).json({
      status: 0,
      message: "No records found"
    });
  }
};