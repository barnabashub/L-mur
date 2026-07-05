import React, { useCallback, useState } from 'react';
import { Image, ScrollView, Switch, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api, imageUrl, type IdeaDetail, type ListSummary } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { spacing, useTheme } from '../../lib/theme'
import { Badge, Button, Card, Empty, ErrorText, Input, Label, StarPicker, Stars } from '../../components/ui';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function IdeaScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [myLists, setMyLists] = useState<ListSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Kipipálás űrlap
  const [publicText, setPublicText] = useState('');
  const [privateText, setPrivateText] = useState('');
  const [imagePublic, setImagePublic] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);

  // Értékelés űrlap
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const load = useCallback(async () => {
    try {
      const detail = await api.idea(id, token);
      setIdea(detail);
      const mine = detail.reviews.find((r) => r.mine);
      if (mine) {
        setStars(mine.stars);
        setReviewText(mine.text ?? '');
      }
      if (token) {
        setMyLists((await api.lists(token)).filter((l) => !l.isSystem));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!idea) {
    return (
      <View style={{ padding: spacing.l }}>
        <ErrorText text={error} />
      </View>
    );
  }

  const img = imageUrl(idea.imagePath);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]) setImage(res.assets[0]);
  };

  const complete = async () => {
    if (!token) return router.push('/login');
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('date', new Date().toISOString().slice(0, 10));
      form.append('imagePublic', imagePublic ? 'true' : 'false');
      if (publicText.trim()) form.append('publicText', publicText.trim());
      if (privateText.trim()) form.append('privateText', privateText.trim());
      if (image) {
        // @ts-expect-error — React Native FormData fájl-objektum
        form.append('image', { uri: image.uri, name: 'photo.jpg', type: image.mimeType ?? 'image/jpeg' });
      }
      await api.complete(token, idea.id, form);
      setPublicText('');
      setPrivateText('');
      setImage(null);
      setInfo('Gratulálunk, kipipálva! Az emlék bekerült a naplótokba. 💛');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendReview = async () => {
    if (!token) return router.push('/login');
    setError(null);
    try {
      await api.review(token, idea.id, stars, reviewText.trim());
      setInfo('Köszönjük az értékelést!');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const addTo = async (listId: string) => {
    if (!token) return router.push('/login');
    setError(null);
    try {
      await api.addToList(token, listId, idea.id);
      setInfo('Hozzáadva a listához!');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.m }}>
      <Stack.Screen options={{ title: idea.title }} />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {img && <Image source={{ uri: img }} style={{ width: '100%', height: 200 }} />}
        <View style={{ padding: spacing.l, gap: spacing.s }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Badge text={idea.category} />
            <Badge
              text={idea.isLocationIndependent ? '🌍 Helyfüggetlen' : `📍 ${idea.locationName}`}
              tone="muted"
            />
            {idea.isSeasonal && idea.seasonLabel && <Badge text={`📅 ${idea.seasonLabel}`} tone="muted" />}
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: t.text }}>{idea.title}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.l, alignItems: 'center' }}>
            <Stars value={idea.avg} count={idea.reviews.length} />
            <Text style={{ fontSize: 12, color: t.muted }}>✔ {idea.completionCount} teljesítés</Text>
          </View>
          <Text style={{ fontSize: 14, lineHeight: 21, color: t.text }}>{idea.description}</Text>
          <Text style={{ fontSize: 11, color: t.faint }}>
            Feltöltötte: {idea.submitterName} · {formatDate(idea.createdAt)} · frissítve: {formatDate(idea.updatedAt)}
          </Text>
        </View>
      </Card>

      {idea.partner && (
        <Card style={{ backgroundColor: t.amberBg, borderColor: 'rgba(251, 191, 36, 0.4)', gap: 6 }}>
          <Text style={{ fontWeight: '700', color: t.amber }}>🎟️ Kedvezmény a Kettesben-pároknak</Text>
          <Text style={{ fontSize: 13, color: t.amber }}>
            {idea.partner.name}: {idea.partner.discountText}
          </Text>
          {idea.partner.couponCode ? (
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                letterSpacing: 4,
                color: t.amber,
                backgroundColor: t.card,
                borderRadius: 8,
                paddingVertical: 6,
                textAlign: 'center',
                overflow: 'hidden',
              }}
            >
              {idea.partner.couponCode}
            </Text>
          ) : (
            <Text style={{ fontSize: 12, color: t.amber }}>A kuponkódhoz lépj be a Profil fülön.</Text>
          )}
        </Card>
      )}

      <ErrorText text={error} />
      {info && (
        <Card style={{ backgroundColor: t.greenBg, borderColor: 'rgba(52, 211, 153, 0.4)' }}>
          <Text style={{ color: t.green, fontSize: 13 }}>{info}</Text>
        </Card>
      )}

      <Card style={{ gap: spacing.s }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: t.text }}>Kipipálom ✔</Text>
        <Text style={{ fontSize: 12, color: t.muted }}>
          A privát részeket csak ti ketten látjátok.
        </Text>
        <Label text="Publikus élménybeszámoló (opcionális)" />
        <Input value={publicText} onChangeText={setPublicText} multiline numberOfLines={2} />
        <Label text="Privát emlék — csak nektek 🔒" />
        <Input value={privateText} onChangeText={setPrivateText} multiline numberOfLines={3} />
        <Button title={image ? `📷 Fotó kiválasztva ✔` : '📷 Fotó hozzáadása'} variant="secondary" onPress={pickImage} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
          <Switch value={imagePublic} onValueChange={setImagePublic} trackColor={{ true: t.primary }} />
          <Text style={{ fontSize: 13, color: t.text, flex: 1 }}>A fotó lehet publikus</Text>
        </View>
        <Button title="Kipipálom, megvolt! 🎉" onPress={complete} loading={busy} />
        {idea.myCompletions.length > 0 && (
          <Text style={{ fontSize: 12, color: t.muted }}>
            Korábbi teljesítéseitek: {idea.myCompletions.map((c) => formatDate(c.date)).join(', ')}
          </Text>
        )}
      </Card>

      {myLists.length > 0 && (
        <Card style={{ gap: spacing.s }}>
          <Text style={{ fontWeight: '700', color: t.text }}>Bakancslistára teszem</Text>
          {myLists.map((l) => (
            <Button key={l.id} title={`+ ${l.title}`} variant="secondary" onPress={() => addTo(l.id)} />
          ))}
        </Card>
      )}

      <Card style={{ gap: spacing.s }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: t.text }}>Értékelés ⭐</Text>
        <StarPicker value={stars} onChange={setStars} />
        <Input value={reviewText} onChangeText={setReviewText} placeholder="Pár mondat a tapasztalatokról…" multiline />
        <Button title="Értékelés küldése" onPress={sendReview} disabled={stars === 0} />
      </Card>

      {idea.publicCompletions.length > 0 && (
        <View style={{ gap: spacing.s }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: t.text }}>
            Párok, akik már teljesítették 📸
          </Text>
          {idea.publicCompletions.map((c) => {
            const cImg = imageUrl(c.imagePath);
            return (
              <Card key={c.id} style={{ padding: 0, overflow: 'hidden' }}>
                {cImg && <Image source={{ uri: cImg }} style={{ width: '100%', height: 160 }} />}
                <View style={{ padding: spacing.m, gap: 4 }}>
                  {!!c.publicText && <Text style={{ fontSize: 13, color: t.text }}>„{c.publicText}"</Text>}
                  {!!c.privateText && <Text style={{ fontSize: 13, color: t.muted }}>🔒 {c.privateText}</Text>}
                  <Text style={{ fontSize: 11, color: t.faint }}>
                    {c.userName} · {formatDate(c.date)}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <View style={{ gap: spacing.s, marginBottom: spacing.xl }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: t.text }}>Értékelések</Text>
        {idea.reviews.length === 0 ? (
          <Empty text="Még senki sem értékelte — legyetek ti az elsők!" />
        ) : (
          idea.reviews.map((r) => (
            <Card key={r.id} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Stars value={r.stars} />
                <Text style={{ fontSize: 11, color: t.faint }}>
                  {r.userName} · {formatDate(r.createdAt)}
                </Text>
              </View>
              {!!r.text && <Text style={{ fontSize: 13, color: t.text }}>{r.text}</Text>}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
