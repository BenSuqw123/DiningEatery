import React, { createContext, useState, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, Button, Text, Icon } from 'react-native-paper';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
    });

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setConfig({ title, message, type, onConfirm });
        setVisible(true);
    };

    const hideAlert = () => setVisible(false);

    const getTheme = () => {
        switch (config.type) {
            case 'success': return { color: '#00a36dff', icon: 'check-circle-outline' };
            case 'error': return { color: '#ef4444', icon: 'alert-circle-outline' };
            default: return { color: '#2563eb', icon: 'information-outline' };
        }
    };

    const theme = getTheme();

    return (
        <AlertContext.Provider value={showAlert}>
            {children}
            <Portal>
                <Dialog visible={visible} onDismiss={hideAlert} style={styles.dialog}>
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.color + '15' }]}>
                            <Icon source={theme.icon} size={40} color={theme.color} />
                        </View>

                        <Text style={styles.title}>{config.title}</Text>
                        <Text style={styles.message}>{config.message}</Text>
                    </View>

                    <Dialog.Actions style={styles.actions}>
                        <Button
                            mode="text"
                            onPress={hideAlert}
                            labelStyle={styles.cancelBtn}
                        >
                            Đóng
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                if (config.onConfirm) config.onConfirm();
                                hideAlert();
                            }}
                            style={styles.confirmBtn}
                            buttonColor={theme.color}
                            labelStyle={{ fontWeight: '700' }}
                        >
                            Xác nhận
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </AlertContext.Provider>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 24,
        backgroundColor: '#fff',
        paddingVertical: 10,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 10,
    },
    actions: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        justifyContent: 'center',
    },
    confirmBtn: {
        borderRadius: 12,
        flex: 1,
        marginLeft: 10,
    },
    cancelBtn: {
        color: '#94a3b8',
        fontSize: 14,
    }
});

export const useAlert = () => useContext(AlertContext);