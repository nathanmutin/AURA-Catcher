import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import FakeReCaptcha from '../FakeReCaptcha/FakeReCaptcha';
import AddChoiceModal from './AddChoiceModal';
import './Layout.css';

interface LayoutOutletContext {
    openAdd: () => void;
}

/**
 * Le bouton d'ajout d'une page ouvre la même modale que celui de la
 * navigation : la modale vit donc ici, au-dessus des pages, et une page y
 * accède par le contexte de l'Outlet plutôt qu'en ouvrant la sienne.
 */
export const useAddChoice = () => useOutletContext<LayoutOutletContext>().openAdd;

const Layout: React.FC = () => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const location = useLocation();

    // Le choix d'ajout n'est pas une page : il se referme dès qu'on navigue,
    // y compris par le bouton retour.
    useEffect(() => {
        setIsAddOpen(false);
    }, [location.pathname, location.search]);

    return (
        <div className="layout">
            <FakeReCaptcha />
            <Navbar onAddClick={() => setIsAddOpen(true)} />
            {/* Content Area */}
            <main className="layout-main">
                <Outlet context={{ openAdd: () => setIsAddOpen(true) } satisfies LayoutOutletContext} />
            </main>

            {isAddOpen && <AddChoiceModal onClose={() => setIsAddOpen(false)} />}
        </div>
    );
};

export default Layout;
