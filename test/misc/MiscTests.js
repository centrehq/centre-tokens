var FiatTokenProxy = artifacts.require('FiatTokenProxy');

var tokenUtils = require('./../TokenTestUtils.js');;
var newBigNumber = tokenUtils.newBigNumber;
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var expectRevert = tokenUtils.expectRevert;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;

var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var getInitializedV1 = tokenUtils.getInitializedV1;
var FiatToken = tokenUtils.FiatToken;

var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var addressEquals = AccountUtils.addressEquals;

var maxAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var amount = 100;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.isTrue(addressEquals(proxy.address, token.address));
  });


  // No Payable Function

  it('ms001 no payable function', async function () {
    var success = false;
    try {
      await web3.eth.sendTransaction({ from: Accounts.arbitraryAccount, to: token.address, value: 1 });
    } catch (e) {
      success = true;
    }
    assert.equal(true, success);
  });

  // Same Address

  it('ms002 should transfer to self has correct final balance', async function() {
    let mintAmount = 50;
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });
    await token.transfer(Accounts.arbitraryAccount, mintAmount, { from: Accounts.arbitraryAccount });

    var customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms003 should transferFrom to self from approved account and have correct final balance', async function() {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });

    await token.approve(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.arbitraryAccount });
    await token.transferFrom(Accounts.arbitraryAccount, Accounts.arbitraryAccount, mintAmount, { from: Accounts.arbitraryAccount2 });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms004 should transferFrom to self from approved self and have correct final balance', async function() {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });

    await token.approve(Accounts.arbitraryAccount, mintAmount, { from: Accounts.arbitraryAccount });
    await token.transferFrom(Accounts.arbitraryAccount, Accounts.arbitraryAccount, mintAmount, { from: Accounts.arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms005 should mint to self with correct final balance', async function () {
    var mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.minterAccount, mintAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms006 should approve correct allowance for self', async function () {
    var mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });
    await token.approve(Accounts.arbitraryAccount, amount, { from: Accounts.arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.arbitraryAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms007 should configureMinter for masterMinter', async function () {
    await token.configureMinter(Accounts.masterMinterAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.masterMinterAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  // Multiple Minters

  it('ms009 should configure two minters', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms010 should configure two minters and each mint distinct amounts', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount1, { from: Accounts.minterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount2, { from: Accounts.arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount - mintAmount2) },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(mintAmount1 + mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms011 should configure two minters, each minting distinct amounts and then remove one minter', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount1, { from: Accounts.minterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount2, { from: Accounts.arbitraryAccount });
    await token.removeMinter(Accounts.arbitraryAccount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount1) },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(mintAmount1 + mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms012 should configure two minters and adjust both allowances', async function () {
    var adjustment = 10;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount) },
    ];
    await checkVariables([token], [customVars]);

    await token.configureMinter(Accounts.minterAccount, amount - adjustment, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount + adjustment, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - adjustment) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount + adjustment) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms013 should configure two minters, one with zero allowance fails to mint', async function () {
    var mintAmount = 10;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, 0, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.minterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) },
    ];
    await expectRevert(token.mint(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms014 should configure two minters and fail to mint when paused', async function () {
    var mintAmount = 10;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    await token.pause({ from: Accounts.pauserAccount });
    var customVars = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await expectRevert(token.mint(Accounts.pauserAccount, mintAmount, { from: Accounts.minterAccount }));
    await expectRevert(token.mint(Accounts.pauserAccount, mintAmount, { from: Accounts.arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms015 should configure two minters, blacklist one and ensure it cannot mint, then unblacklist and ensure it can mint', async function () {
    var mintAmount = 10;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    await token.blacklist(Accounts.minterAccount, { from: Accounts.blacklisterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(mintAmount) },
    ];
    await expectRevert(token.mint(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.minterAccount }));
    await checkVariables([token], [customVars]);

    await token.unBlacklist(Accounts.minterAccount, { from: Accounts.blacklisterAccount });
    await token.mint(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.minterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount + mintAmount) },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(mintAmount + mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms016 should configure two minters, each mints to themselves and then burns certain amount', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;
    var burnAmount = 10;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.configureMinter(Accounts.arbitraryAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.minterAccount, mintAmount1, { from: Accounts.minterAccount });
    await token.mint(Accounts.arbitraryAccount, mintAmount2, { from: Accounts.arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount - mintAmount2) },
      { 'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(mintAmount1) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);

    await token.burn(burnAmount, { from: Accounts.minterAccount });
    await token.burn(burnAmount, { from: Accounts.arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': newBigNumber(amount - mintAmount2) },
      { 'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(mintAmount1 - burnAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount2 - burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount1 + mintAmount2 - burnAmount - burnAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // 0 Input

  it('ms018 should approve 0 token allowance with unchanged state', async function () {
    await token.approve(Accounts.minterAccount, 0, { from: Accounts.arbitraryAccount });
    await checkVariables([token], [[]]);
  });

  it('ms019 should transferFrom 0 tokens with unchanged state', async function () {
    await token.transferFrom(Accounts.arbitraryAccount, Accounts.pauserAccount, 0, { from: Accounts.arbitraryAccount2 });
    await checkVariables([token], [[]]);
  });

  it('ms020 should transfer 0 tokens with unchanged state', async function () {
    await token.transfer(Accounts.arbitraryAccount, 0, { from: Accounts.arbitraryAccount2 });
    await checkVariables([token], [[]]);
  });

  it('ms036 should get allowance for same address', async function() {
    await token.approve(Accounts.arbitraryAccount, amount, {from: Accounts.arbitraryAccount});
    var allowance = newBigNumber(await token.allowance(Accounts.arbitraryAccount, Accounts.arbitraryAccount));
    assert(allowance.cmp(newBigNumber(amount))==0);
  });

  // Return value

  /*
  * Calls (i.e token.mint.call(...) , token.approve.call(...) etc.) expose the
  * return value of functions while transactions (token.mint(...) ,
  * token.approve(...) etc.) return transaction receipts and do not read
  * function return values. Calls, unlike transactions, do not permanently
  * modify data. However, both calls and transactions execute code on the
  * network. That is, token.mint.call(...) will revert if and only if
  * token.mint(...) reverts.
  *
  * "Choosing between a transaction and a call is as simple as deciding
  *  whether you want to read data, or write it."
  *  - truffle docs
  *    (https://truffleframework.com/docs/getting_started/contracts)
  */

  it('ms039 should return true on mint', async function() {
    var mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
    ];
    assert(await token.mint.call(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms040 should return true on approve', async function() {
    assert(await token.approve.call(Accounts.minterAccount, amount, { from: Accounts.arbitraryAccount }));
  });

  it('ms041 should return true on transferFrom', async function() {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });
    await token.approve(Accounts.masterMinterAccount, mintAmount, { from: Accounts.arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.masterMinterAccount', 'expectedValue': newBigNumber(mintAmount)},
    ];
    assert(await token.transferFrom.call(Accounts.arbitraryAccount, Accounts.pauserAccount, mintAmount, { from: Accounts.masterMinterAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms042 should return true on transfer', async function() {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) }
    ];
    assert(await token.transfer.call(Accounts.pauserAccount, mintAmount, { from: Accounts.arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms043 should return true on configureMinter', async function() {
    assert(await token.configureMinter.call(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount }));
  });

  it('ms044 should return true on removeMinter', async function() {
    assert(await token.removeMinter.call(Accounts.minterAccount, { from: Accounts.masterMinterAccount }));
  });

  it('ms045 initialized should be in slot 8, byte 21', async function() {
    var initialized = await getInitializedV1(token);
    assert.equal("0x01", initialized);
  });

  it('ms046 initialized should be 0 before initialization', async function() {
    var rawToken = await newToken();
    var newProxy = await FiatTokenProxy.new(rawToken.address, { from: Accounts.arbitraryAccount });
    var token = await FiatToken.at(newProxy.address);
    var initialized = await getInitializedV1(token);
    assert.equal("0x0", initialized);
  });

  it('ms047 configureMinter works on amount=2^256-1', async function() {
    await token.configureMinter(Accounts.minterAccount, maxAmount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms048 mint works on amount=2^256-1', async function() {
    await token.configureMinter(Accounts.minterAccount, maxAmount, { from: Accounts.masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, maxAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms049 burn on works on amount=2^256-1', async function() {
    await token.configureMinter(Accounts.minterAccount, maxAmount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.minterAccount, maxAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.burn(maxAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms050 approve works on amount=2^256-1', async function() {
    await token.configureMinter(Accounts.minterAccount, maxAmount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, maxAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.approve(Accounts.arbitraryAccount2, maxAmount, {from: Accounts.arbitraryAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'allowance.arbitraryAccount.arbitraryAccount2', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms051 transfer works on amount=2^256-1', async function() {
    await token.configureMinter(Accounts.minterAccount, maxAmount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, maxAmount, { from: Accounts.minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.transfer(Accounts.arbitraryAccount2, maxAmount, {from: Accounts.arbitraryAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) },
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms052 transferFrom works on amount=2^256-1', async function() {
    await token.configureMinter(Accounts.minterAccount, maxAmount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, maxAmount, { from: Accounts.minterAccount });
    await token.approve(Accounts.arbitraryAccount2, maxAmount, {from: Accounts.arbitraryAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'allowance.arbitraryAccount.arbitraryAccount2', 'expectedValue': newBigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.transferFrom(Accounts.arbitraryAccount, Accounts.arbitraryAccount2, maxAmount, {from: Accounts.arbitraryAccount2});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(maxAmount) },
    ];
    await checkVariables([token], [customVars]);
   });
}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('FiatToken_MiscTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
