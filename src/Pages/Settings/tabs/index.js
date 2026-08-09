import addresses from "./addresses.jsx";
import fav from "./favourites.jsx";
import history from "./history.jsx";
import wallet from "./wallet.jsx";
// The profile form carries phone-change OTP and password rules; it is reused as
// it stands rather than rewritten, and picks up its look from the stylesheet.
import account from "../mobile/tabs/account.jsx";

const tabs = { history, addresses, wallet, fav, account };

export default tabs;
