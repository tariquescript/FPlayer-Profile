import logo from "../assets/FLogo.png";
import myLogo from '../assets/myLogo.png'


function Header() {
  return (
    <>
      <div className="max-w-5xl max-sm:max-w-[90%] max-sm:pr-0  mx-auto navbar bg-base-100 shadow-sm">
        <div className="flex-1">
         <a href="/">
          <img src={logo} alt="" className="h-15 max-sm:h-13 w-auto" />
          </a> 
        </div>
        <div className="flex-5 max-sm:flex-1">
          <a href="https://tariquescript.vercel.app/">
            <img src={myLogo} className='h-15 max-sm:h-13 w-auto mx-auto max-sm:mr-0   border-black'></img>
          </a>
        </div>

        <div className="flex-none max-sm:hidden ">
          <ul className="menu menu-horizontal px-1">
            <li>
              <a href="https://github.com/tariquescript" class="flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.57v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.23v3.3c0 .32.21.69.83.57A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/tariquedev" class="flex items-center ">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6S0 4.88 0 3.5 1.11 1 2.49 1s2.49 1.12 2.49 2.5zM0 8h5v16H0V8zm7.5 0h4.78v2.18h.07c.67-1.27 2.3-2.6 4.73-2.6C22.1 7.58 24 10.11 24 14.07V24h-5v-8.22c0-1.96-.04-4.48-2.73-4.48-2.73 0-3.15 2.13-3.15 4.34V24h-5V8z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://x.com/tariquescript" class="flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2H21.5l-7.39 8.44L22 22h-6.89l-5.39-7.04L3.5 22H.244l7.9-9.02L2 2h7.06l4.87 6.36L18.244 2zm-1.21 18h1.8L7.98 4H6.06l10.974 16z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default Header;
