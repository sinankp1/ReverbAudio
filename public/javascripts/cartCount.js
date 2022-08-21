
const count = async () => {
    try {
        const res = await axios.get('/cartCount', {
        }).then((e) => {
            console.log(e.data.response)
            document.getElementById('cart-count').innerHTML = e.data.response
        })
    } catch (err) {
        console.log(err.response.data)
    }
    try {
        const res = await axios.get('/wishlistCount', {
        }).then((e) => {
            console.log(e.data.response)
            document.getElementById('wishlist-count').innerHTML = e.data.response
        })
    } catch (err) {
        console.log(err.response.data)
    }


}
document.addEventListener("DOMContentLoaded", count)