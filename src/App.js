import React, { useState } from "react";
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MailIcon from '@material-ui/icons/Mail';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import ListSubheader from '@material-ui/core/ListSubheader';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import gamesjSON from './games.json'
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import { purple } from '@material-ui/core/colors';

const drawerWidth = 280;

const theme = createMuiTheme({
  palette: {
    type: 'dark'
  },
});



const useStyles = makeStyles({
  root: {
    display: 'flex',
  },
  listDrawer: {
    backgroundColor: theme.palette.background.paper,
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  // necessary for content to be below app bar
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
});

async function getJsonAsync(game, file) {
  let response = await fetch(`scripts/${game}/${file}`);
  let data = await response.json()
  return data;
}

export default function App(props) {
  const [novelText, setNovelText] = useState("");

  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  function getNovelText(game, chName) {
    setNovelText("Loading...")
    getJsonAsync(game, chName).then(data => {
      setNovelText(generateContent(data))
      window.scrollTo(0, 0)
    });
  }

  function generateContent(json) {
    return (
      <div>
        {json.map((elem, index) => (
          <div>
            <p style={{ color: elem.color }}><b>{elem.labelJp}/{elem.labelEn}</b></p>
            {elem.textJp.map((sentence, index) => (
              <div><br />
                <span>{sentence}</span><br />
                <span>{elem.textEn[index]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const [itemState, setItemState] = useState("");
  const [scriptSelected, setScriptSelected] = useState(null);

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      <List>
        {gamesjSON.map((game, gameIndex) => (
          <div>
            <ListItem button onClick={
              () => {
                if (itemState !== game.name)
                  setItemState(game.name)
                else
                  setItemState("")
              }}>
              <ListItemText primary={game.name} />

              {itemState !== game.name ? <ExpandLess /> : <ExpandMore />}

            </ListItem>
            <List className={classes.listDrawer}>

              <Collapse
                in={itemState === game.name}
                timeout='0'
              >
                {gamesjSON[gameIndex].files.map((file, index) => (
                  <ListItem button 
                    key={file.file} 
                    onClick={() => { setScriptSelected(file); getNovelText(game.name, file.file); }}
                    selected={scriptSelected === file}
                  >
                    <ListItemIcon><LocalLibraryIcon /></ListItemIcon>
                    <ListItemText primary={file.name} />
                  </ListItem>
                ))}
              </Collapse>
            </List>
          </div>
        ))}
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
            {scriptSelected === null ? "Select a script":scriptSelected.name}
          </Typography>
          </Toolbar>
        </AppBar>
        <nav className={classes.drawer} aria-label="mailbox folders">
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Hidden smUp implementation="css">
            <Drawer
              variant="temporary"
              anchor={theme.direction === 'rtl' ? 'right' : 'left'}
              open={mobileOpen}
              onClose={handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
            >
              {drawer}
            </Drawer>
          </Hidden>
          <Hidden xsDown implementation="css">
            <Drawer
              classes={{
                paper: classes.drawerPaper,
              }}
              variant="permanent"
              open
            >
              {drawer}
            </Drawer>
          </Hidden>
        </nav>
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <Typography paragraph component={'span'} >
            <p>
              This website reports novel dialogs only to help learning Japanese. <br />
              <b>It is recommended to install a plugin like Rikaichamp to show tootip information for kanji and words.</b>
            </p>
            {novelText}
          </Typography>
        </main>
      </div>
    </ThemeProvider>
  );
}