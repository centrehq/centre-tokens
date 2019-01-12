var Tx = require('ethereumjs-tx');
var tokenUtils = require('./../TokenTestUtils.js');
var FiatToken = tokenUtils.FiatToken;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var expectRevert = tokenUtils.expectRevert;
var masterMinterRole = tokenUtils.masterMinterRole;
var blacklisterRole = tokenUtils.blacklisterRole;
var pauserRole = tokenUtils.pauserRole;
var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;

var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var AccountPrivateKeys = AccountUtils.AccountPrivateKeys;

var abiUtils = require('./../ABIUtils.js');
var makeRawTransaction = abiUtils.makeRawTransaction;
var sendRawTransaction = abiUtils.sendRawTransaction;
var functionSignature = abiUtils.functionSignature;
var encodeAddress = abiUtils.encodeAddress;
var encodeUint = abiUtils.encodeUint;
var msgData0 = abiUtils.msgData0;
var msgData = abiUtils.msgData;
var msgData1 = abiUtils.msgData1;
var msgData2 = abiUtils.msgData2;
var msgData3 = abiUtils.msgData3;

// Encodes methodName, 32 byte string of 0, and address.
function mockStringAddressEncode(methodName, address) {
    var version = encodeUint(32) + encodeUint(0); // encode 32 byte string of 0's 
    return functionSignature(methodName) + version + encodeAddress(address);
}

async function run_tests(newToken, accounts) {

    beforeEach(async function checkBefore() {
        rawToken = await newToken();
        var tokenConfig = await initializeTokenWithProxy(rawToken);
        proxy = tokenConfig.proxy;
        token = tokenConfig.token;
        assert.equal(proxy.address, token.address);
    });

    // sanity check for pausable
    it('abi004 FiatToken pause() is public', async function () {
        let badData = functionSignature('pause()');
        let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await sendRawTransaction(raw);
        var customVars = [
            { 'variable': 'paused', 'expectedValue': true }
        ];
        await checkVariables([token], [customVars]);
    });

    it('abi040 Blacklistable constructor is not a function', async function () {
        let badData = functionSignature('Blacklistable()');
        let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi042 Ownable constructor is not a function', async function () {
        let badData = functionSignature('Ownable()');
       let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi005 Pausable constructor is not a function', async function () {
       let badData = functionSignature('Pausable()');
       let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi043 FiatTokenProxy constructor is not a function', async function () {
       let badData = functionSignature('FiatTokenProxy()');
       let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi027 UpgradeabilityProxy constructor', async function () {
        let badData = msgData('UpgradeabilityProxy(address)', Accounts.arbitraryAccount);
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi055 Proxy constructor is not a function', async function () {
        let badData = functionSignature('Proxy()');
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi056 Proxy _delegate is internal', async function () {
        let badData = msgData('_delegate(address)', Accounts.arbitraryAccount);
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi057 Proxy _willFallback is internal', async function () {
        let badData = functionSignature('_willFallback()');
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi058 Proxy _fallback is internal', async function () {
        let badData = functionSignature('_fallback()');
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi050 Upgradeability implementation is internal', async function () {
        let badData = msgData('UpgradeabilityProxy(address)', Accounts.arbitraryAccount);
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi051 AdminUpgradeabillityProxy constructor is not a function', async function () {
        let badData = msgData('AdminUpgradeabillityProxy(address)', Accounts.arbitraryAccount);
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi053 AdminUpgradeabillityProxy _setAdmin is internal', async function () {
        let badData = msgData('AdminUpgradeabillityProxy(address)', Accounts.arbitraryAccount);
        let raw = await makeRawTransaction(
            badData,
            Accounts.arbitraryAccount,
            AccountPrivateKeys.arbitraryPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi041 FiatToken constructor is not a function', async function () {
       let badData = functionSignature('FiatToken()');
       let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi025 setOwner is internal', async function () {
       let badData = msgData('setOwner(address)', Accounts.pauserAccount);
       let raw = await makeRawTransaction(
             badData,
             Accounts.pauserAccount,
             AccountPrivateKeys.pauserPrivateKey,
             token.address);
        await expectRevert(sendRawTransaction(raw));
    });

    it('abi028 UpgradeabilityProxy._upgradeTo is internal', async function () {
        let badData = mockStringAddressEncode('_upgradeTo(string,address)', Accounts.pauserAccount);
        let raw = await makeRawTransaction(
            badData,
            Accounts.tokenOwnerAccount,
            AccountPrivateKeys.tokenOwnerPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
    });
}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('FiatToken_ABIHackingTests', run_tests);

module.exports = {
    run_tests: run_tests,
}
