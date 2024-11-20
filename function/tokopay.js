const axios = require("axios");
const crypto = require('crypto');

const TOKOPAY_API_URL = "https://api.tokopay.id/v1/order";
const MERCHANT_ID = "#";
const SECRET = "#";

function generateSignature(merchantId, secret) {
    const hash = crypto.createHash('md5');
    hash.update(`${merchantId}:${secret}`);
    return hash.digest('hex');
}

function generateSignatureForWithdrawal(merchantId, secret, nominal) {
    const hash = crypto.createHash('md5');
    hash.update(`${merchantId}:${secret}:${nominal}`);
    return hash.digest('hex');
}

async function createTransaction(refId, nominal, metode) {
    const url = `${TOKOPAY_API_URL}?merchant=${MERCHANT_ID}&secret=${SECRET}&ref_id=${refId}&nominal=${nominal}&metode=${metode}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Gagal membuat transaksi: ${error.message}`);
    }
}

async function checkPaymentStatus(refId, nominal, metode) {
    const url = `${TOKOPAY_API_URL}?merchant=${MERCHANT_ID}&secret=${SECRET}&ref_id=${refId}&nominal=${nominal}&metode=${metode}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Gagal memeriksa status pembayaran: ${error.message}`);
    }
}

async function checkAccountBalance() {
    const signature = generateSignature(MERCHANT_ID, SECRET);
    const url = `https://api.tokopay.id/v1/merchant/balance?merchant=${MERCHANT_ID}&signature=${signature}`;

    try {
        const response = await axios.get(url);
        const { nama_toko, saldo_tersedia, saldo_tertahan } = response.data.data;
        return { nama_toko, saldo_tersedia, saldo_tertahan };
    } catch (error) {
        throw new Error(`Gagal memeriksa saldo akun: ${error.message}`);
    }
}

async function tarikSaldo(nominal) {
    const signature = generateSignatureForWithdrawal(MERCHANT_ID, SECRET, nominal);
    const url = `https://api.tokopay.id/v1/tarik-saldo`;

    try {
        const response = await axios.post(url, {
            nominal: nominal,
            merchant_id: MERCHANT_ID,
            signature: signature
        });
        return response.data;
    } catch (error) {
        throw new Error(`Gagal melakukan tarik saldo: ${error.message}`);
    }
}

module.exports = {
    createTransaction,
    checkPaymentStatus,
    checkAccountBalance,
    tarikSaldo
};
