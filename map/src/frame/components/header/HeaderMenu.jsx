import { AppBar, Box, Button, IconButton, SvgIcon, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import React from 'react';
import { ReactComponent as Logo } from '../../../assets/logo.svg';
import styles from './header.module.css';

const pages = [
    {
        name: 'Docs',
        url: '/docs/intro',
    },
    {
        name: 'Blog',
        url: '/blog',
    },
    {
        name: '💳 Purchases',
        url: '/docs/user/purchases',
    },
    {
        name: '🌍 Map',
        url: '/map',
    },
    {
        name: '🚵‍ Join us',
        url: '/docs/hiring',
    },
];
export default function HeaderMenu() {
    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: 1300,
                height: '60px',
                background: '#ffffff',
            }}
        >
            <Toolbar>
                <IconButton
                    target="_blank"
                    component={Link}
                    to={'/'}
                    className={styles.menuItem}
                    sx={{ fontWeight: '700 !important', ml: -2, mt: -0.5, mr: -0.77 }}
                >
                    <SvgIcon component={Logo} inheritViewBox className={styles.logo} />
                    OsmAnd
                </IconButton>
                <Box className={styles.menu}>
                    {pages.map((page) => (
                        <Button
                            target="_blank"
                            component={Link}
                            to={page.url}
                            key={page.name}
                            className={styles.menuItem}
                            sx={page.url === '/map' ? { color: '#237bff !important' } : { color: '#1c1e21 !important' }}
                        >
                            {page.name}
                        </Button>
                    ))}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
