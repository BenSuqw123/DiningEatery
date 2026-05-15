import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { List, Button, Avatar, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import { MyUserContext } from '../../configs/MyContext';

const ApprovalChef = () => {
    const [chefs, setChefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const user = useContext(MyUserContext);

    const loadPending = async () => {
        try {
            const res = await authApis(user.token).get(endpoints['pending-chefs']);
            setChefs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const approveChef = async (chefId) => {
        setLoading(true);
        try {
            await authApis(user.token).patch(endpoints['approve-chef'](chefId));
            Alert.alert("Thành công", "Đã duyệt chef!");
            loadPending(); 
        } catch (err) {
            Alert.alert("Lỗi", "Không thể duyệt chef.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPending(); }, []);

    return (
        <FlatList
            data={chefs}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <List.Item title={`${item.first_name} ${item.last_name}`} description="Chờ duyệt"
                    left={() =>
                        item.avatar
                            ? <Avatar.Image size={44} source={{ uri: item.avatar }} />
                            : <Avatar.Text size={44} label={item.first_name?.[0] ?? '?'} />
                    }
                    right={() => <Button mode="contained" loading={loading} onPress={() => approveChef(item.id)}>Duyệt</Button>}
                />
            )}
            ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Chip icon="check-all">Không có chef nào chờ duyệt</Chip>
                </View>
            }
        />
    );
};

export default ApprovalChef;